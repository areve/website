import commonWgsl from "./common.wgsl?raw";
import normalsWgsl from "./normals.wgsl?raw";

export function setupNormalsResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer,
  srcTexture: GPUTexture,
  srcSampler: GPUSampler
) {
  const module = device.createShaderModule({ code: `${commonWgsl}\n${normalsWgsl}` });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vsNorm" },
    fragment: { module, entryPoint: "fsNorm", targets: [{ format: presentationFormat }] },
    primitive: { topology: "triangle-list" },
  });

  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: srcSampler },
      { binding: 2, resource: srcTexture.createView() },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.5, 0.5, 1.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "normals renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    pipeline,
    bindGroup,
    texture,
    renderPassDescriptor,
    width,
    height,
  };
}

export function renderNormalsToTexture(
  encoder: GPUCommandEncoder,
  normals: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;
    renderPassDescriptor: GPURenderPassDescriptor;
  }
) {
  const view = normals.texture.createView();
  (normals.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = view;
  const pass = encoder.beginRenderPass(normals.renderPassDescriptor);
  pass.setPipeline(normals.pipeline);
  pass.setBindGroup(0, normals.bindGroup);
  pass.draw(6);
  pass.end();
}
