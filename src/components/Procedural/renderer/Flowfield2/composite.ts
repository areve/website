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
  const bindGroupLayout = pipeline.getBindGroupLayout(0);

  return {
    sampler,
    pipeline,
    bindGroupLayout,
    dataBuffer,
    backgroundTexture: background.texture,
    particleTexture: particle.texture,
  };
}

export function renderComposite(
  encoder: GPUCommandEncoder,
  context: GPUCanvasContext,
  composite: {
    pipeline: GPURenderPipeline;
    sampler: GPUSampler;
    bindGroupLayout: GPUBindGroupLayout;
    dataBuffer: GPUBuffer;
    backgroundTexture: GPUTexture;
    particleTexture: GPUTexture;
  },
  device: GPUDevice,
  trailsTexture: GPUTexture
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

  const bindGroup = device.createBindGroup({
    layout: composite.bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: composite.dataBuffer } },
      { binding: 1, resource: composite.sampler },
      { binding: 2, resource: composite.backgroundTexture.createView() },
      { binding: 3, resource: composite.particleTexture.createView() },
      { binding: 4, resource: trailsTexture.createView() },
    ],
  });

  const pass = encoder.beginRenderPass(descriptor);
  pass.setPipeline(composite.pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();
}
