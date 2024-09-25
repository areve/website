import worldTextureWgsl from "./worldTexture.wgsl";
import {
  createComputePipelineBuilder,
  createUniformBuffer,
  getBufferOffsets,
} from "../lib/buffer";

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

  const {
    pipeline,
    bindGroups: [
      textureBindGroup,
      worldMapBindGroup,
      textureDimensionsBindGroup,
    ],
    uniformBufferInfos: [worldMapUniform, textureDimensionsUniform],
  } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer: data.buffer })
    .createUniformBuffer(getWorldMapUniforms, getTextureDimensions)
    .setComputeModule({
      entryPoint: "computeMain",
      code: worldTextureWgsl,
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
      Math.ceil(data.width / workgroupSize.x),
      Math.ceil(data.height / workgroupSize.y)
    );
    computePass.end();
    device.queue.submit([encoder.finish()]);
  }

  return {
    compute,
    updateBuffers,
    buffer: data.buffer,
    width: data.width,
    height: data.height,
  };
}
