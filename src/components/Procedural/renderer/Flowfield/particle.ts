import commonWgsl from "./wgsl/common.wgsl?raw";
import computeWgsl from "../Flowfield/wgsl/compute.wgsl?raw";
import particleWgslRaw from "../Flowfield/wgsl/particle.wgsl?raw";

const config = {
  particleCount: 5000,
  particlePixelSize: 5.0,
};

export function setupParticleResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer
) {
  // create particle-specific buffers here
  const particleBufferSize = config.particleCount * 3 * 4;
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const wgsl = `${commonWgsl}\n${computeWgsl.replace(
    /\$\{particleCount\}i/g,
    `${config.particleCount}i`
  )}`;
  const computeModule = device.createShaderModule({ code: wgsl });
  const compute = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs" },
  });
  const computeInit = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "init" },
  });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(
    /\$\{particlePixelSize\}/g,
    `${config.particlePixelSize}`
  )}`;
  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particle = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: particleModule, entryPoint: "vs", buffers: [] },
    fragment: {
      module: particleModule,
      entryPoint: "fs",
      targets: [
        {
          format: presentationFormat,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
    multisample: { count: 1 },
  });

  const computeA = device.createBindGroup({
    layout: compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
      { binding: 2, resource: { buffer: particleBufferB } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });
  const computeB = device.createBindGroup({
    layout: compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
      { binding: 2, resource: { buffer: particleBufferA } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  const computeInitBindGroup = device.createBindGroup({
    layout: computeInit.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 2, resource: { buffer: particleBufferA } },
    ],
  });

  const particleRenderA = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
    ],
  });
  const particleRenderB = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
    ],
  });

  return {
    config,
    pipelines: { compute, computeInit, particle },
    bindGroups: {
      computeA,
      computeB,
      computeInitBindGroup,
      particleRenderA,
      particleRenderB,
    },
    buffers: { particleBufferA, particleBufferB, paramsBuffer },
  };
}
