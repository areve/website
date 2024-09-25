import worldDataWgsl from "./worldData.wgsl";
import {
  createComputePipelineBuilder,
  createStorageBuffer,
  createUniformBuffer,
  getBufferOffsets,
} from "../lib/buffer";

const float32size = 4;
const worldPointByteSize = 12 * float32size;

export function createWorldData(
  device: GPUDevice,
  width: number,
  height: number,
  getWorldMapUniforms: () => ArrayBufferLike
) {
  const textureStorageBuffer = createStorageBuffer(
    device,
    width * height * worldPointByteSize
  );

  const getTextureDimensions = () => new Uint32Array([width, height]);

  const {
    pipeline,
    bindGroups: [textureBindGroup, worldMapBindGroup, textureDimensionsBindGroup],
    uniformBufferInfos: [worldMapUniform, textureDimensionsUniform],
  } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer: textureStorageBuffer })
    .createUniformBuffer(getWorldMapUniforms, getTextureDimensions)
    .setComputeModule({
      entryPoint: "computeMain",
      code: worldDataWgsl,
    })
    .create();

  function updateBuffers() {
    worldMapUniform.update();
    textureDimensionsUniform.update();
  }

  async function compute(device: GPUDevice) {
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, textureBindGroup);
    computePass.setBindGroup(1, worldMapBindGroup);
    computePass.setBindGroup(2, textureDimensionsBindGroup);
    const workgroupSize = { x: 16, y: 16 };
    computePass.dispatchWorkgroups(
      Math.ceil(width / workgroupSize.x),
      Math.ceil(height / workgroupSize.y)
    );
    computePass.end();
    device.queue.submit([encoder.finish()]);
  }

  return {
    updateBuffers,
    compute,
    buffer: textureStorageBuffer,
    width,
    height,
  };
}
