import commonWgslRaw from "./wgsl/common.wgsl?raw";
import fragmentWgslRaw from "../Flowfield/wgsl/fragment.wgsl?raw";
import { clearTextureToBlack } from "./texture";

const config = {
  showBackgroundShader: true,
};

export function setupBackgroundResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
) {
  const commonWgsl = commonWgslRaw;
  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;
  const module = device.createShaderModule({
    label: "flowfield shader",
    code: fragmentWgsl,
  });

  const pipeline = device.createRenderPipeline({
    label: "background pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format: presentationFormat }] },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
  };

  clearTextureToBlack(device, texture);

  return {
    pipeline,
    bindGroup,
    texture,
    renderPassDescriptor,
  };
}

export function renderBackgroundToTexture(
  encoder: GPUCommandEncoder,
  background: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;
    renderPassDescriptor: GPURenderPassDescriptor;
  }
) {
  const backgroundView = background.texture.createView();
  (background.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view =
    backgroundView;
  const pass = encoder.beginRenderPass(background.renderPassDescriptor);
  if (config.showBackgroundShader) {
    pass.setPipeline(background.pipeline);
    pass.setBindGroup(0, background.bindGroup);
    pass.draw(6);
  }
  pass.end();
}
