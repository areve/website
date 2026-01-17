import commonWgslRaw from "../../lib/wgsl/common.wgsl?raw";
import accFadeWgslRaw from "../../lib/wgsl/accFade.wgsl?raw";
import { clearTextureToBlack } from "./texture";

export function setupAccumulationResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
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

  const accumulationA_bg = device.createBindGroup({
    layout: accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: accumulationA.createView() },
    ],
  });
  const accumulationB_bg = device.createBindGroup({
    layout: accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: accumulationB.createView() },
    ],
  });

  clearTextureToBlack(device, accumulationA);

  return {
    pipelines: { accumulationFade },
    textures: { accumulationA, accumulationB, sampler },
    bindGroups: {
      accumulationA: accumulationA_bg,
      accumulationB: accumulationB_bg,
    },
  };
}
