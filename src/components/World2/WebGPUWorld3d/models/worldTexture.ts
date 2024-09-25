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
  const {
    pipeline,
    bindGroups: [textureBindGroup, worldMapBindGroup],
    uniformBufferInfos: [worldMapUniform],
  } = createComputePipelineBuilder(device)
    .addBuffer({ type: "storage", buffer: data.buffer })
    .createUniformBuffer(getWorldMapUniforms)
    .setComputeModule({
      entryPoint: "computeMain",
      //TODO there's a better way to defined these constants!
      code: /* wgsl */ `
        const dataWidth: u32 = ${data.width}u;
        const dataHeight: u32 = ${data.height}u;
        ${worldTextureWgsl}
      `,
    })
    .create();

  async function compute(device: GPUDevice) {
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, textureBindGroup);
    computePass.setBindGroup(1, worldMapBindGroup);
    const workgroupSize = { x: 16, y: 16 };
    computePass.dispatchWorkgroups(
      Math.ceil(data.width / workgroupSize.x),
      Math.ceil(data.height / workgroupSize.y)
    );
    computePass.end();
    device.queue.submit([encoder.finish()]);
  }

  function updateBuffers() {
    worldMapUniform.update();
  }

  return {
    compute,
    updateBuffers,
    buffer: data.buffer,
    width: data.width,
    height: data.height,
  };
}
