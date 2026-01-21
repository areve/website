import commonWgsl from "./common.wgsl?raw";
import compositeWgsl from "./composite.wgsl?raw";

// Simple runtime config for composite behaviour
export const config = {
  renderBackground: true,
};

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

  // Use the provided background texture; composite shader will decide
  // whether to sample it based on the runtime flag buffer.
  const backgroundTexture: GPUTexture = background.texture;

  // Create a small uniform buffer carrying the renderBackground flag
  const flagArray = new Float32Array([config.renderBackground ? 1.0 : 0.0, 0.0, 0.0, 0.0]);
  const flagBuffer = device.createBuffer({
    size: flagArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(flagBuffer, 0, flagArray.buffer, flagArray.byteOffset, flagArray.byteLength);

  return {
    sampler,
    pipeline,
    bindGroupLayout,
    dataBuffer,
    backgroundTexture,
    particleTexture: particle.texture,
    flagBuffer,
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
    flagBuffer: GPUBuffer;
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
        { binding: 5, resource: { buffer: composite.flagBuffer } },
    ],
  });

  const pass = encoder.beginRenderPass(descriptor);
  pass.setPipeline(composite.pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();
}
