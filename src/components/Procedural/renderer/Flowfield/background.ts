import commonWgslRaw from "../../lib/wgsl/common.wgsl?raw";
import fragmentWgslRaw from "../Flowfield/wgsl/fragment.wgsl?raw";

export function setupBackgroundThings(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  buffers: { dataBuffer: GPUBuffer }
) {
  const commonWgsl = commonWgslRaw;
  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;
  const module = device.createShaderModule({ label: "flowfield shader", code: fragmentWgsl });

  const pipeline = device.createRenderPipeline({
    label: "background pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format: presentationFormat }] },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }],
  });

  return { pipeline, bindGroup };
}
