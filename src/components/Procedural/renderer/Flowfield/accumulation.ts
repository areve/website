import commonWgslRaw from "./wgsl/common.wgsl?raw";
import accumulationFadeWgsl from "./wgsl/accumulationFade.wgsl?raw";
import { clearTextureToBlack } from "./texture";

export function setupAccumulationResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
) {
  const textureA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const textureB = device.createTexture({
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
  const fadeWgsl = `${commonWgsl}\n${accumulationFadeWgsl}`;
  const fadeModule = device.createShaderModule({ code: fadeWgsl });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: fadeModule, entryPoint: "vs2" },
    fragment: {
      module: fadeModule,
      entryPoint: "fs2",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupA = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textureA.createView() },
    ],
  });
  const bindGroupB = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textureB.createView() },
    ],
  });

  clearTextureToBlack(device, textureA);

  return {
    pipeline,
    textureA,
    textureB,
    sampler,
    bindGroupA,
    bindGroupB,
  };
}
