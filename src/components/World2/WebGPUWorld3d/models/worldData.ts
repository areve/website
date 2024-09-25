import worldDataWgsl from "./worldData.wgsl";
import {
  createComputePipelineBuilder,
  createStorageBuffer,
} from "../lib/buffer";

const float32size = 4;
const worldPointByteSize = 12 * float32size;

export function createWorldData(
  device: GPUDevice,
  width: number,
  height: number,
  getWorldMapParams: () => ArrayBufferLike
) {
  const buffer = createStorageBuffer(
    device,
    width * height * worldPointByteSize
  );

  const getTextureDimensions = () => new Uint32Array([width, height]);

  const { updateBuffers, compute } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer })
    .createUniformBuffer(getWorldMapParams, getTextureDimensions)
    .setComputeModule(worldDataWgsl)
    .create();

  return {
    updateBuffers,
    compute,
    buffer,
    width,
    height,
  };
}
