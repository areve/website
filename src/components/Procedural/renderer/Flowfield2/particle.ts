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
  dataBuffer: GPUBuffer
) {
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  // place particles on a grid across the viewport
  const positions = new Float32Array(config.particleCount * 2);
  const cols = Math.ceil(Math.sqrt(config.particleCount));
  const rows = Math.ceil(config.particleCount / cols);
  const spacingX = width / cols;
  const spacingY = height / rows;
  for (let i = 0; i < config.particleCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[i * 2 + 0] = (col + 0.5) * spacingX;
    positions[i * 2 + 1] = (row + 0.5) * spacingY;
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

  // create lifetimes buffer
  const lifetimes = new Float32Array(config.particleCount);
  for (let i = 0; i < config.particleCount; i++)
    lifetimes[i] = Math.random() * config.maxLife;
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
      targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
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
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
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
  particle: {
    computePipeline: GPUComputePipeline;
    posBuffer: GPUBuffer;
    numParticles: number;
    simBuffer: GPUBuffer;
    lifetimesBuffer: GPUBuffer;
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
      { binding: 1, resource: normals.texture.createView() },
      { binding: 2, resource: { buffer: particle.posBuffer } },
      { binding: 3, resource: { buffer: particle.lifetimesBuffer } },
      { binding: 4, resource: { buffer: particle.simBuffer } },
    ],
  });

  const pass = encoder.beginComputePass();
  pass.setPipeline(particle.computePipeline);
  pass.setBindGroup(0, bindGroup);
  const groups = Math.ceil(particle.numParticles / 64);
  pass.dispatchWorkgroups(groups);
  pass.end();
}
