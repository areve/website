import worldTextureWgsl from "./worldTexture.wgsl";
import { createComputePipelineBuilder } from "../lib/buffer";

export function createWorldTexture(
  device: GPUDevice,
  data: {
    buffer: GPUBuffer;
    width: number;
    height: number;
  },
  getWorldMapUniforms: () => ArrayBufferLike
) {
  const getTextureDimensions = () => new Uint32Array([data.width, data.height]);

  const { compute, updateBuffers } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer: data.buffer })
    .createUniformBuffer(getWorldMapUniforms, getTextureDimensions)
    .setComputeModule(worldTextureWgsl)
    .create();

  return {
    compute,
    updateBuffers,
    buffer: data.buffer,
    width: data.width,
    height: data.height,
  };
}
