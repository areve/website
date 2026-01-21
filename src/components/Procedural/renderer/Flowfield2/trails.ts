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

  // Ensure both trails textures start fully transparent to avoid uninitialized pixels
  const clearEncoder = device.createCommandEncoder();
  for (const t of [textureA, textureB]) {
    const clearView = t.createView();
    const clearPass = clearEncoder.beginRenderPass({
      colorAttachments: [
        { view: clearView, loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 0] },
      ],
    });
    clearPass.end();
  }
  device.queue.submit([clearEncoder.finish()]);

  // Fade pass shader (reprojects previous-frame trails by world-space coordinates
  // so trails pan/zoom/rotate with the background)
  const fadeWgsl = `
    // current canvas size (used only for reference; uniforms carry current/prev view)
    const W: f32 = ${width}.0;
    const H: f32 = ${height}.0;

    // decay per frame (fraction of alpha to subtract)
    const DECAY: f32 = 1.0 / 5.0 / 60.0;

    struct Uniforms {
      width: f32,
      height: f32,
      seed: f32,
      scale: f32,
      x: f32,
      y: f32,
      z: f32,
      zoom: f32,
      rotation: f32,
    };

    @group(0) @binding(0) var samp: sampler;
    @group(0) @binding(1) var prevTex: texture_2d<f32>;
    // bind 2 = current frame uniforms, bind 3 = previous frame uniforms
    @group(0) @binding(2) var<uniform> curr: Uniforms;
    @group(0) @binding(3) var<uniform> prev: Uniforms;

    fn pixelToWorld(px: vec2<f32>, u: Uniforms) -> vec2<f32> {
      let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                         (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
      let baseX = px.x / u.scale * u.zoom + u.x / u.scale;
      let baseY = px.y / u.scale * u.zoom + u.y / u.scale;
      let rel = vec2f(baseX - center.x, baseY - center.y);
      let cos_r = cos(u.rotation);
      let sin_r = sin(u.rotation);
      let rotX = rel.x * cos_r - rel.y * sin_r;
      let rotY = rel.x * sin_r + rel.y * cos_r;
      return vec2f(rotX + center.x, rotY + center.y);
    }

    fn worldToPixel(p: vec2<f32>, u: Uniforms) -> vec2<f32> {
      let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                         (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
      let d = p - center;
      let cos_r = cos(u.rotation);
      let sin_r = sin(u.rotation);
      let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
      return dprime * (u.scale / u.zoom) + vec2f(u.width / 2.0, u.height / 2.0);
    }

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment fn fsFade(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
      // coord.xy is pixel position in the CURRENT FRAME's screen space
      let pixel = coord.xy;
      // map current pixel -> world position using current uniforms
      let world = pixelToWorld(pixel, curr);
      // map that world position to the PREVIOUS frame's pixel coordinates
      let prevPx = worldToPixel(world, prev);
      // Sample unconditionally at a clamped UV to satisfy WGSL's uniform control-flow
      // requirement. After sampling, mask out-of-bounds results so they are treated as transparent.
      let uv = prevPx / vec2<f32>(prev.width, prev.height);
      let uvClamped = clamp(uv, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
      let sampled = textureSample(prevTex, samp, uvClamped);
      var inside: f32 = 0.0;
      if (uv.x >= 0.0 && uv.x < 1.0 && uv.y >= 0.0 && uv.y < 1.0) {
        inside = 1.0;
      }
      let prevCol = sampled * inside;

      // Subtract DECAY from alpha and scale RGB to keep premultiplied property.
      let newA = max(prevCol.a - DECAY, 0.0);
      var newRgb = vec3<f32>(0.0, 0.0, 0.0);
      if (prevCol.a > 0.0) {
        newRgb = prevCol.rgb * (newA / prevCol.a);
      }
      return vec4<f32>(newRgb, newA);
    }
  `;

  // Particle-add shader: sample particle texture, convert to premultiplied yellow
  const addWgsl = `
    const W: f32 = ${width}.0;
    const H: f32 = ${height}.0;
    @group(0) @binding(0) var samp: sampler;
    @group(0) @binding(1) var pTex: texture_2d<f32>;

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }
    @fragment fn fsAdd(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
      let uv = coord.xy / vec2<f32>(W, H);
      let p = textureSample(pTex, samp, uv);
      // use particle alpha to drive a yellow premultiplied contribution
      let a = p.a;
      let col = vec3<f32>(1.0, 1.0, 0.0) * a;
      return vec4<f32>(col, a);
    }
  `;

  
    const fadeModule = device.createShaderModule({ code: fadeWgsl });
    const addModule = device.createShaderModule({ code: addWgsl });

    const fadePipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: fadeModule, entryPoint: "vsBlit" },
      fragment: { module: fadeModule, entryPoint: "fsFade", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });

    const addPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: addModule, entryPoint: "vsBlit" },
      fragment: {
        module: addModule,
        entryPoint: "fsAdd",
        targets: [
          {
            format,
            // premultiplied-src blending: src*1 + dst*(1-src.a)
            blend: {
              color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });

    const addBindGroupLayout = addPipeline.getBindGroupLayout(0);

    return {
      textures: [textureA, textureB],
      srcIndex: 0,
      sampler,
      fadePipeline,
      addPipeline,
      addBindGroupLayout,
    };
}

export function renderTrails(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  trails: { textures: GPUTexture[]; srcIndex: number; sampler: GPUSampler; fadePipeline: GPURenderPipeline; addPipeline: GPURenderPipeline; addBindGroupLayout: GPUBindGroupLayout },
  particleTexture: GPUTexture,
  dataBuffer: GPUBuffer,
  prevDataBuffer: GPUBuffer
) {
  const srcIndex = trails.srcIndex;
  const dstIndex = 1 - srcIndex;
  const srcView = trails.textures[srcIndex].createView();
  const dstView = trails.textures[dstIndex].createView();

  // Fade pass: reproject previous trails into current view and apply decay
  const fadeBind = device.createBindGroup({ layout: trails.fadePipeline.getBindGroupLayout(0), entries: [
    { binding: 0, resource: trails.sampler },
    { binding: 1, resource: srcView },
    { binding: 2, resource: { buffer: dataBuffer } },
    { binding: 3, resource: { buffer: prevDataBuffer } },
  ] });
  const fadeAttachment: GPURenderPassColorAttachment = { view: dstView, loadOp: "clear", storeOp: "store", clearValue: [0,0,0,0] };
  const fadeDesc: GPURenderPassDescriptor = { colorAttachments: [fadeAttachment] };
  const fadePass = encoder.beginRenderPass(fadeDesc);
  fadePass.setPipeline(trails.fadePipeline);
  fadePass.setBindGroup(0, fadeBind);
  fadePass.draw(6);
  fadePass.end();

  // Add particles into dst using premultiplied blending (load existing dst)
  const addBindGroup = device.createBindGroup({ layout: trails.addBindGroupLayout, entries: [ { binding: 0, resource: trails.sampler }, { binding: 1, resource: particleTexture.createView() } ] });
  const addAttachment: GPURenderPassColorAttachment = { view: dstView, loadOp: "load", storeOp: "store" };
  const addDesc: GPURenderPassDescriptor = { colorAttachments: [addAttachment] };
  const addPass = encoder.beginRenderPass(addDesc);
  addPass.setPipeline(trails.addPipeline);
  addPass.setBindGroup(0, addBindGroup);
  addPass.draw(6);
  addPass.end();

  trails.srcIndex = dstIndex;
}
 
