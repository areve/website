import commonWgslRaw from "../../lib/wgsl/common.wgsl?raw";
import accFadeWgslRaw from "../../lib/wgsl/accFade.wgsl?raw";
import compositeWgslRaw from "../../lib/wgsl/composite.wgsl?raw";

export function setupAccumulationThings(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  buffers: {
    particleBufferA: GPUBuffer;
    particleBufferB: GPUBuffer;
    paramsBuffer: GPUBuffer;
    dataBuffer: GPUBuffer;
  }
) {
  // textures + sampler
  const accumulationA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const accumulationB = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const background = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear",
  });

  const commonWgsl = commonWgslRaw;
  const accFadeWgsl = `${commonWgsl}\n${accFadeWgslRaw}`;
  const accFadeModule = device.createShaderModule({ code: accFadeWgsl });
  const accumulationFade = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: accFadeModule, entryPoint: "vs2" },
    fragment: {
      module: accFadeModule,
      entryPoint: "fs2",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const compositeWgsl = `${commonWgsl}\n${compositeWgslRaw}`;
  const compositeModule = device.createShaderModule({ code: compositeWgsl });
  const composite = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: compositeModule, entryPoint: "vs3" },
    fragment: {
      module: compositeModule,
      entryPoint: "fs3",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const accumulationA_bg = device.createBindGroup({
    layout: accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: accumulationA.createView() },
    ],
  });
  const accumulationB_bg = device.createBindGroup({
    layout: accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: accumulationB.createView() },
    ],
  });

  const compositeA = device.createBindGroup({
    layout: composite.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationA.createView() },
    ],
  });
  const compositeB = device.createBindGroup({
    layout: composite.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.createView() },
      { binding: 3, resource: accumulationB.createView() },
    ],
  });

  return {
    pipelines: { accumulationFade, composite },
    textures: { accumulationA, accumulationB, background, sampler },
    bindGroups: {
      accumulationA: accumulationA_bg,
      accumulationB: accumulationB_bg,
      compositeA,
      compositeB,
    },
  };
}
