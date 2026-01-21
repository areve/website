import commonWgsl from "./common.wgsl?raw";
import compositeWgsl from "./composite.wgsl?raw";

export function setupCompositeResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer,
  background: {
    texture: GPUTexture;
  },
  particle: {
    texture: GPUTexture;
  },
  trails: {
    texture: GPUTexture;
  }
) {
  const blitModule = device.createShaderModule({
    code: `${commonWgsl}\n${compositeWgsl}`,
  });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: blitModule, entryPoint: "vsBlit" },
    fragment: {
      module: blitModule,
      entryPoint: "fsBlit",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.texture.createView() },
      { binding: 3, resource: particle.texture.createView() },
      { binding: 4, resource: trails.texture.createView() },
    ],
  });

  return {
    sampler,
    pipeline,
    bindGroup,
  };
}

export function renderComposite(
  encoder: GPUCommandEncoder,
  context: GPUCanvasContext,
  composite: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
  }
) {
  const view = context.getCurrentTexture().createView();
  const descriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view,
        loadOp: "clear",
        storeOp: "store",
        clearValue: [0, 0, 0, 1],
      },
    ],
  };
  const pass = encoder.beginRenderPass(descriptor);
  pass.setPipeline(composite.pipeline);
  pass.setBindGroup(0, composite.bindGroup);
  pass.draw(6);
  pass.end();
}
