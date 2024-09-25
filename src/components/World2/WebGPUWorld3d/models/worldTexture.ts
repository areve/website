import worldTextureWgsl from "./worldTexture.wgsl";
import { createComputePipelineBuilder } from "../lib/buffer";

export function createWorldTexture(
  device: GPUDevice,
  buffer: GPUBuffer,
  width: number,
  height: number,
  getWorldMapParams: () => ArrayBufferLike
) {
  const getTextureDimensions = () => new Uint32Array([width, height]);

  const { compute, updateBuffers } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer })
    .createUniformBuffer(getWorldMapParams, getTextureDimensions)
    .setComputeModule(worldTextureWgsl)
    .create();

  return {
    compute,
    updateBuffers,
    buffer,
    width,
    height,
  };
}
