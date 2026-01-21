import commonWgsl from "./common.wgsl?raw";
import noiseWgsl from "./noise.wgsl?raw";
import particleWgsl from "./particle.wgsl?raw";

const config = {
  particleCount: 1024,
  particleSpeed: 500,
  maxLife: 5.0,
  // fade durations (seconds)
  fadeIn: 0.05,
  fadeOut: 1.5,
  // particle size in pixels
  particleSize: 2.0,
  // RGBA particle color
  particleColor: [1.0, 1.0, 1.0, 1.0],
  // maximum random respawn delay (seconds)
  maxDelayTime: 5.0,
  // damping factor for velocity (higher = more deceleration)
  damping: 0.1,
};

export function setupParticleResources(
  device: GPUDevice,
  width: number,
  height: number,
  dataBuffer: GPUBuffer,
  // pass the shared data object so we can initialize particles in world-space
  sharedData: { width: number; height: number; seed: number; scale: number; x: number; y: number; z: number; zoom: number; rotation: number }
) {
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  // Positions are owned and initialized by the compute shader. Compute the byte size
  // here so we can create a GPU storage buffer without allocating a large CPU array.
  const posByteLength = config.particleCount * 2 * Float32Array.BYTES_PER_ELEMENT;

  const posBuffer = device.createBuffer({
    size: posByteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });

  // create lifetimes buffer (time-until-spawn while waiting, remaining-life while alive)
  const lifetimes = new Float32Array(config.particleCount);
  // create states buffer (0 = waiting, 1 = alive)
  const states = new Float32Array(config.particleCount);
  for (let i = 0; i < config.particleCount; i++) {
    lifetimes[i] = Math.random() * config.maxLife; // randomized initial delay
    states[i] = 0.0; // start waiting
  }
  const lifetimesBuffer = device.createBuffer({
    size: lifetimes.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    lifetimesBuffer,
    0,
    lifetimes.buffer,
    lifetimes.byteOffset,
    lifetimes.byteLength
  );

  const statesBuffer = device.createBuffer({
    size: states.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    statesBuffer,
    0,
    states.buffer,
    states.byteOffset,
    states.byteLength
  );

  // per-particle alpha values for fade in/out
  const alphas = new Float32Array(config.particleCount);
  const alphasBuffer = device.createBuffer({
    size: alphas.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    alphasBuffer,
    0,
    alphas.buffer,
    alphas.byteOffset,
    alphas.byteLength
  );

  // per-particle velocities (vec2) for momentum
  const velocities = new Float32Array(config.particleCount * 2);
  const velocitiesBuffer = device.createBuffer({
    size: velocities.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    velocitiesBuffer,
    0,
    velocities.buffer,
    velocities.byteOffset,
    velocities.byteLength
  );

  // create shader module (common + particle)
  const module = device.createShaderModule({
    code: `
      ${commonWgsl}
      ${noiseWgsl}
      ${particleWgsl}
    `,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
        // enable alpha blending so particles can fade smoothly
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: { topology: "triangle-list" },
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 0.0],
    loadOp: "clear",
    storeOp: "store",
  };
  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "particle renderPass",
    colorAttachments: [colorAttachment],
  };



  // simulation params uniform (dt, speed, width, height, maxLife, seed)
  const seed = Math.random() * 1000.0;
  const simParams = new Float32Array([
    0.016,
    config.particleSpeed,
    config.damping,
    width,
    height,
    config.maxLife,
    seed,
    config.fadeIn,
    config.fadeOut,
    config.particleSize,
    config.maxDelayTime,
    0.0, // padding so the following vec4 color is 16-byte aligned
    0.0, // padding
    config.particleColor[0],
    config.particleColor[1],
    config.particleColor[2],
    config.particleColor[3],
  ]);
  const simBuffer = device.createBuffer({
    size: simParams.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    simBuffer,
    0,
    simParams.buffer,
    simParams.byteOffset,
    simParams.byteLength
  );

  // Now that simBuffer exists, create the render bind group which references it
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      // bind the positions buffer as a read-only storage buffer for the vertex stage
      { binding: 2, resource: { buffer: posBuffer } },
      // sim uniform (binding 4) is used by vertex/fragment for size/color/fade
      { binding: 4, resource: { buffer: simBuffer } },
      // binding 7 is the read-only alias used by the vertex shader
      { binding: 7, resource: { buffer: alphasBuffer } },
    ],
  });

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "cs" },
  });

  function setParams(params: Partial<{ fadeIn: number; fadeOut: number; particleSize: number; particleColor: number[]; maxDelayTime: number; damping: number; }>) {
    Object.assign(config, params);
  }

  return {
    texture,
    pipeline,
    posBuffer,
    numParticles: config.particleCount,
    lifetimesBuffer,
    // expose states buffer for compute bindgroup
    statesBuffer,
    // expose alphas buffer for render and compute
    alphasBuffer,
    // velocities buffer for compute
    velocitiesBuffer,
    colorAttachment,
    renderPassDescriptor,
    bindGroup,
    computePipeline,
    simBuffer,
    maxLife: config.maxLife,
    seed,
    setParams,
  };
}

export function renderParticleTexture(
  encoder: GPUCommandEncoder,
  particle: {
    texture: GPUTexture;
    pipeline: GPURenderPipeline;
    posBuffer: GPUBuffer;
    numParticles: number;
    renderPassDescriptor: GPURenderPassDescriptor;
    colorAttachment: GPURenderPassColorAttachment;
    bindGroup: GPUBindGroup;
  }
) {
  const view = particle.texture.createView();
  (
    particle.renderPassDescriptor
      .colorAttachments as GPURenderPassColorAttachment[]
  )[0].view = view;
  const pass = encoder.beginRenderPass(particle.renderPassDescriptor);
  pass.setBindGroup(0, particle.bindGroup);
  pass.setPipeline(particle.pipeline);
  pass.draw(6, particle.numParticles);
  pass.end();
}

export function updateParticles(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  dataBuffer: GPUBuffer,
  particle: {
    computePipeline: GPUComputePipeline;
    posBuffer: GPUBuffer;
    numParticles: number;
    simBuffer: GPUBuffer;
    lifetimesBuffer: GPUBuffer;
    statesBuffer: GPUBuffer;
    alphasBuffer: GPUBuffer;
    velocitiesBuffer: GPUBuffer;
    maxLife: number;
    seed: number;
  },
  normals: {
    texture: GPUTexture;
    width: number;
    height: number;
  },
  deltaTime: number
) {
  const simArray = new Float32Array([
    deltaTime,
    config.particleSpeed,
    config.damping,
    normals.width,
    normals.height,
    particle.maxLife,
    particle.seed,
    config.fadeIn,
    config.fadeOut,
    config.particleSize,
    config.maxDelayTime,
    0.0, // padding so the following vec4 color is 16-byte aligned
    0.0, // padding
    config.particleColor[0],
    config.particleColor[1],
    config.particleColor[2],
    config.particleColor[3],
  ]);
  device.queue.writeBuffer(
    particle.simBuffer,
    0,
    simArray.buffer,
    simArray.byteOffset,
    simArray.byteLength
  );

  const bindGroup = device.createBindGroup({
    layout: particle.computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: normals.texture.createView() },
      { binding: 2, resource: { buffer: particle.posBuffer } },
      { binding: 3, resource: { buffer: particle.lifetimesBuffer } },
      { binding: 4, resource: { buffer: particle.simBuffer } },
      // states buffer binding (binding 5)
      { binding: 5, resource: { buffer: particle.statesBuffer } },
      // alphas buffer (binding 6) - read/write for compute
      { binding: 6, resource: { buffer: particle.alphasBuffer } },
      // velocities buffer (binding 8) - read/write for compute
      { binding: 8, resource: { buffer: particle.velocitiesBuffer } },
    ],
  });

  const pass = encoder.beginComputePass();
  pass.setPipeline(particle.computePipeline);
  pass.setBindGroup(0, bindGroup);
  const groups = Math.ceil(particle.numParticles / 64);
  pass.dispatchWorkgroups(groups);
  pass.end();
}
