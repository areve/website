import worldDataWgsl from "./wgsl/worldData.wgsl";
import {
  CodeInfo,
  createPipelineBuilder,
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
  const [worldMapUniforms] = getBufferOffsets(getWorldMapUniforms);
  const uniformsBuffer = createUniformBuffer(device, worldMapUniforms.end);
  const textureStorageBuffer = createStorageBuffer(
    device,
    width * height * worldPointByteSize
  );

  const code: CodeInfo = {
    entryPoint: "computeMain",
    code: /* wgsl */ `
      const width = ${width}u;
      const height = ${height}u;
      ${worldDataWgsl}


    `,
  };

  const {
    pipeline,
    bindGroups: [textureBindGroup, worldMapBindGroup],
  } = createPipelineBuilder(device)
    .addBuffer({ type: "storage", buffer: textureStorageBuffer })
    .addBuffer({ type: "uniform", buffer: uniformsBuffer })
    .create(code);

  function updateBuffers() {
    device.queue.writeBuffer(
      uniformsBuffer,
      worldMapUniforms.offset,
      worldMapUniforms.getBuffer()
    );
  }

  async function compute(device: GPUDevice) {
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, textureBindGroup);
    computePass.setBindGroup(1, worldMapBindGroup);
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
