import noiseWgsl from "./noise.wgsl?raw";
import openSimplex3dWgsl from "./openSimplex3d.wgsl?raw";
import commonWgsl from "./common.wgsl?raw";
import backgroundWgsl from "./background.wgsl?raw";

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
  const module = device.createShaderModule({
    label: "background shader",
    code: `
      ${commonWgsl}
      ${noiseWgsl}
      ${openSimplex3dWgsl}
      ${backgroundWgsl}`,
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


  // create the background render target and sampler
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "background renderPass",
    colorAttachments: [colorAttachment],
  };
  return {
    pipeline,
    bindGroup,
    texture,
    sampler,
    colorAttachment,
    renderPassDescriptor,
    width,
    height,
  };
}
export function renderBackgroundToTexture(
  encoder: GPUCommandEncoder,
  background: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;
    renderPassDescriptor: GPURenderPassDescriptor;
    normalsTexture?: GPUTexture;
    width: number;
    height: number;
  }
) {
  const backgroundView = background.texture.createView();
  (
    background.renderPassDescriptor
      .colorAttachments as GPURenderPassColorAttachment[]
  )[0].view = backgroundView;
  const pass = encoder.beginRenderPass(background.renderPassDescriptor);
  pass.setPipeline(background.pipeline);
  pass.setBindGroup(0, background.bindGroup);
  pass.draw(6);
  pass.end();
}
