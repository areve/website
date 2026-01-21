export function setupTrailsResources(
  device: GPUDevice,
  width: number,
  height: number
) {
  const format = navigator.gpu.getPreferredCanvasFormat();
  const textureA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const textureB = device.createTexture({
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
    const FADE: f32 = 0.985;        // color fade per-frame (still used if needed)
    const FADE_A: f32 = 0.92;       // legacy alpha fade (kept for compatibility)
    const NEW_A: f32 = 0.6;         // initial trail alpha contribution when particle hits
    const DECAY: f32 = 0.03;        // subtractive alpha decay per frame (ensures finite fade)
    @group(0) @binding(0) var samp: sampler;
    @group(0) @binding(1) var prevTex: texture_2d<f32>;
    @group(0) @binding(2) var pTex: texture_2d<f32>;

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }
    @fragment fn fsBlit(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
      let uv = coord.xy / vec2<f32>(W, H);
      let prev = textureSample(prevTex, samp, uv);
      let part = textureSample(pTex, samp, uv);
      // Subtractive alpha decay: ensures alpha reaches zero in finite time.
      var newA: f32 = prev.a;
      var newRGB: vec3<f32> = prev.rgb;
      if (prev.a > 0.0) {
        newA = max(prev.a - DECAY, 0.0);
        // Scale RGB proportionally to new alpha to keep premultiplied invariant
        newRGB = prev.rgb * (newA / prev.a);
      }
      var combined = vec4<f32>(newRGB, newA);
      // Add particle contribution if significant
      if (part.a > 0.01) {
        let contribA = part.a * NEW_A;
        let trailColor = vec3<f32>(1.0, 1.0, 0.0) * contribA;
        combined = combined + vec4<f32>(trailColor, contribA);
      }
      // If alpha is tiny, zero everything to avoid residues
      if (combined.a <= 0.0001) {
        combined = vec4<f32>(0.0, 0.0, 0.0, 0.0);
      }
      return combined;
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
          // no blending: shader outputs the faded/accumulated color directly
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupLayout = pipeline.getBindGroupLayout(0);

  return {
    textures: [textureA, textureB],
    srcIndex: 0,
    sampler,
    pipeline,
    bindGroupLayout,
  };
}

export function renderTrails(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  trails: { textures: GPUTexture[]; srcIndex: number; sampler: GPUSampler; pipeline: GPURenderPipeline; bindGroupLayout: GPUBindGroupLayout },
  particleTexture: GPUTexture
) {
  const srcIndex = trails.srcIndex;
  const dstIndex = 1 - srcIndex;
  const srcView = trails.textures[srcIndex].createView();
  const dstView = trails.textures[dstIndex].createView();

  const bindGroup = device.createBindGroup({
    layout: trails.bindGroupLayout,
    entries: [
      { binding: 0, resource: trails.sampler },
      { binding: 1, resource: srcView },
      { binding: 2, resource: particleTexture.createView() },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: dstView,
    loadOp: "clear",
    storeOp: "store",
    clearValue: [0, 0, 0, 0],
  };
  const passDesc: GPURenderPassDescriptor = { colorAttachments: [colorAttachment] };
  const pass = encoder.beginRenderPass(passDesc);
  pass.setPipeline(trails.pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();

  // flip ping/pong
  trails.srcIndex = dstIndex;
}
