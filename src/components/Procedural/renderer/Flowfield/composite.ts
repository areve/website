import commonWgsl from "../../lib/wgsl/common.wgsl?raw";
import compositeWgslRaw from "../../lib/wgsl/composite.wgsl?raw";

export function setupCompositeResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer,
  background: GPUTexture,
  accumulationA: GPUTexture,
  accumulationB: GPUTexture,
  sampler: GPUSampler
) {
  const compositeWgsl = `${commonWgsl}\n${compositeWgslRaw}`;
  const compositeModule = device.createShaderModule({ code: compositeWgsl });
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

  const compositeBindGroupA = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationA.createView() },
    ],
  });
  const compositeBindGroupB = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationB.createView() },
    ],
  });

  return { pipeline, compositeBindGroupA, compositeBindGroupB };
}
