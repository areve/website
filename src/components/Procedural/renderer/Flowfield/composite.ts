import commonWgsl from "./wgsl/common.wgsl?raw";
import compositeWgsl from "./wgsl/composite.wgsl?raw";

export function setupCompositeResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer,
  background: GPUTexture,
  accumulationA: GPUTexture,
  accumulationB: GPUTexture,
  sampler: GPUSampler
) {
  const wgsl = `${commonWgsl}\n${compositeWgsl}`;
  const compositeModule = device.createShaderModule({ code: wgsl });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: compositeModule, entryPoint: "vs3" },
    fragment: {
      module: compositeModule,
      entryPoint: "fs3",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupA = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationA.createView() },
    ],
  });
  const bindGroupB = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationB.createView() },
    ],
  });

  return { pipeline, bindGroupA, bindGroupB };
}
