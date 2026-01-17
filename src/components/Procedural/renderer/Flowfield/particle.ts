import commonWgslRaw from "../../lib/wgsl/common.wgsl?raw";
import computeWgslRaw from "../Flowfield/wgsl/compute.wgsl?raw";
import particleWgslRaw from "../Flowfield/wgsl/particle.wgsl?raw";

export function setupParticleThings(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  particleCount: number,
  particlePixelSize: number,
  buffers: {
    particleBufferA: GPUBuffer;
    particleBufferB: GPUBuffer;
    paramsBuffer: GPUBuffer;
    dataBuffer: GPUBuffer;
  }
) {
  const commonWgsl = commonWgslRaw;

  const computeWgsl = `${commonWgsl}\n${computeWgslRaw.replace(/\$\{particleCount\}i/g, `${particleCount}i`)}`;
  const computeModule = device.createShaderModule({ code: computeWgsl });
  const compute = device.createComputePipeline({ layout: "auto", compute: { module: computeModule, entryPoint: "cs" } });
  const computeInit = device.createComputePipeline({ layout: "auto", compute: { module: computeModule, entryPoint: "init" } });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(/\$\{particlePixelSize\}/g, `${particlePixelSize}`)}`;
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
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
      { binding: 2, resource: { buffer: buffers.particleBufferB } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });
  const computeB = device.createBindGroup({
    layout: compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });

  const computeInitBind = device.createBindGroup({
    layout: computeInit.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  const particleRenderA = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
    ],
  });
  const particleRenderB = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  return {
    pipelines: { compute, computeInit, particle },
    bindGroups: { computeA, computeB, computeInit: computeInitBind, particleRenderA, particleRenderB },
  };
}
