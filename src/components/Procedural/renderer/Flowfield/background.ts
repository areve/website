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

  clearTextureToBlack(device, texture);

  return { pipeline, bindGroup, texture };
}

export function backgroundDoStuff(
  encoder: GPUCommandEncoder,
  renderPassDescriptor: GPURenderPassDescriptor,
  background: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;
  }
) {
  // render background into offscreen bgTexture (so composite shader can sample it)
  const backgroundView = background.texture.createView();
  (renderPassDescriptor as any).colorAttachments[0].view = backgroundView;
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  if (config.showBackgroundShader) {
    pass.setPipeline(background.pipeline);
    pass.setBindGroup(0, background.bindGroup);
    pass.draw(6);
  }
  // when SHOW_BACKGROUND_SHADER is false we simply clear the bgTexture to black
  pass.end();
}
