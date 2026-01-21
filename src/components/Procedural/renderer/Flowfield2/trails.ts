export function setupTrailsResources(
  device: GPUDevice,
  width: number,
  height: number
) {
  const format = navigator.gpu.getPreferredCanvasFormat();
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

  // simple blit shader: embed resolution constants so we don't need common.wgsl
  const trailsWgsl = `
    const W: f32 = ${width}.0;
    const H: f32 = ${height}.0;
    @group(0) @binding(0) var samp: sampler;
    @group(0) @binding(1) var pTex: texture_2d<f32>;

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment fn fsBlit(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
      let uv = coord.xy / vec2<f32>(W, H);
      return textureSample(pTex, samp, uv);
    }
  `;

  const module = device.createShaderModule({ code: trailsWgsl });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vsBlit" },
    fragment: {
      module,
      entryPoint: "fsBlit",
      targets: [
        {
          format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupLayout = pipeline.getBindGroupLayout(0);

  return {
    texture,
    sampler,
    pipeline,
    bindGroupLayout,
  };
}

export function renderTrails(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  trails: { texture: GPUTexture; sampler: GPUSampler; pipeline: GPURenderPipeline; bindGroupLayout: GPUBindGroupLayout },
  particleTexture: GPUTexture
) {
  const view = trails.texture.createView();

  const bindGroup = device.createBindGroup({
    layout: trails.bindGroupLayout,
    entries: [
      { binding: 0, resource: trails.sampler },
      { binding: 1, resource: particleTexture.createView() },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view,
    loadOp: "load",
    storeOp: "store",
    clearValue: [0, 0, 0, 0],
  };
  const passDesc: GPURenderPassDescriptor = { colorAttachments: [colorAttachment] };
  const pass = encoder.beginRenderPass(passDesc);
  pass.setPipeline(trails.pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();
}
