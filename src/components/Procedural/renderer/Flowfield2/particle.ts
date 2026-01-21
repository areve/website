import commonWgsl from "./common.wgsl?raw";
import noiseWgsl from "./noise.wgsl?raw";
import particleWgsl from "./particle.wgsl?raw";

const config = {
  particleCount: 256,
  particleSpeed: 2000,
  maxLife: 5.0,
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

  // place particles offscreen initially; they'll spawn after a randomized delay
  const positions = new Float32Array(config.particleCount * 2);
  const cols = Math.ceil(Math.sqrt(config.particleCount));
  const rows = Math.ceil(config.particleCount / cols);
  const spacingX = width / cols;
  const spacingY = height / rows;

  // Precompute shared transform values for mapping pixel -> world (same math as background.wgsl)
  const scale = sharedData.scale;
  const zoom = sharedData.zoom;
  const sx = sharedData.x;
  const sy = sharedData.y;
  const rot = sharedData.rotation;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const centerX = (width / 2) / scale * zoom + sx / scale;
  const centerY = (height / 2) / scale * zoom + sy / scale;

  // pick an offscreen pixel to map to world-space so particles are invisible until spawn
  const offPx = -1000;
  const offPy = -1000;
  const baseOffX = offPx / scale * zoom + sx / scale;
  const baseOffY = offPy / scale * zoom + sy / scale;
  const relOffX = baseOffX - centerX;
  const relOffY = baseOffY - centerY;
  const offWorldX = relOffX * cosR - relOffY * sinR + centerX;
  const offWorldY = relOffX * sinR + relOffY * cosR + centerY;

  for (let i = 0; i < config.particleCount; i++) {
    positions[i * 2 + 0] = offWorldX;
    positions[i * 2 + 1] = offWorldY;
  }

  const posBuffer = device.createBuffer({
    size: positions.byteLength,
    usage:
      GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });
  device.queue.writeBuffer(
    posBuffer,
    0,
    positions.buffer,
    positions.byteOffset,
    positions.byteLength
  );

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
    vertex: {
      module,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 8,
          stepMode: "instance",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
        },
      ],
    },
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

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      // binding 7 is the read-only alias used by the vertex shader
      { binding: 7, resource: { buffer: alphasBuffer } },
    ],
  });

  // simulation params uniform (dt, speed, width, height, maxLife, seed)
  const seed = Math.random() * 1000.0;
  const simParams = new Float32Array([
    0.016,
    config.particleSpeed,
    width,
    height,
    config.maxLife,
    seed,
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

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "cs" },
  });

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
    colorAttachment,
    renderPassDescriptor,
    bindGroup,
    computePipeline,
    simBuffer,
    maxLife: config.maxLife,
    seed,
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
  pass.setVertexBuffer(0, particle.posBuffer);
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
    normals.width,
    normals.height,
    particle.maxLife,
    particle.seed,
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
    ],
  });

  const pass = encoder.beginComputePass();
  pass.setPipeline(particle.computePipeline);
  pass.setBindGroup(0, bindGroup);
  const groups = Math.ceil(particle.numParticles / 64);
  pass.dispatchWorkgroups(groups);
  pass.end();
}
