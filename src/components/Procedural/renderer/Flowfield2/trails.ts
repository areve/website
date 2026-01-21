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

  // Fade pass shader (outputs a constant alpha used as srcAlpha to scale dst)
  const fadeWgsl = `
    const W: f32 = ${width}.0;
    const H: f32 = ${height}.0;
    const DECAY: f32 = 0.06; // fraction to reduce each frame
    @group(0) @binding(0) var samp: sampler;
    @group(0) @binding(1) var prevTex: texture_2d<f32>;

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }
    @fragment fn fsFade(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
      let uv = coord.xy / vec2<f32>(W, H);
      let prev = textureSample(prevTex, samp, uv);
      return vec4<f32>(prev.rgb * (1.0 - DECAY), prev.a * (1.0 - DECAY));
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
  particleTexture: GPUTexture
) {
  const srcIndex = trails.srcIndex;
  const dstIndex = 1 - srcIndex;
  const srcView = trails.textures[srcIndex].createView();
  const dstView = trails.textures[dstIndex].createView();

  // Fade pass: read src, write dst (dst = src * (1-DECAY))
  const fadeBind = device.createBindGroup({ layout: trails.fadePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: trails.sampler }, { binding: 1, resource: srcView } ] });
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
 
