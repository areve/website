import noiseWgsl from '../lib/wgsl/noise.wgsl?raw';
import hsv2rgbWgsl from '../lib/wgsl/hsv2rgb.wgsl?raw';
import openSimplex3dWgsl from '../lib/wgsl/openSimplex3d.wgsl?raw';
import fragmentWgslRaw from './Flowfield/wgsl/fragment.wgsl?raw';
import computeWgslRaw from './Flowfield/wgsl/compute.wgsl?raw';
import particleWgslRaw from './Flowfield/wgsl/particle.wgsl?raw';

export async function setupFlowfieldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 100,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotate: 0.0,
    asBuffer() {
      // Return a Float32Array view over an ArrayBuffer so we can write seed as a u32
      const buf = new ArrayBuffer(12 * 4);
      const f32 = new Float32Array(buf);
      const u32 = new Uint32Array(buf);
      f32[0] = this.width;
      f32[1] = this.height;
      u32[2] = (this.seed as number) >>> 0; // write seed as u32 into same slot
      f32[3] = this.scale;
      f32[4] = this.x;
      f32[5] = this.y;
      f32[6] = this.z;
      f32[7] = this.zoom;
      f32[8] = this.rotate;
      // remaining slots are already zero-initialized
      return f32;
    },
  };

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  // --- GPU-driven particle system ---
  const PARTICLE_COUNT = 5000;
  const PARTICLE_SPEED = 2.5;
  const WORKGROUP_SIZE = 64;
  const WORKGROUPS = Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE);
  // epsilon used for centered finite-difference sampling of the noise field
  // (used to approximate derivatives / gradient of the noise).
  const EPS = 0.25;
  // Toggle whether the background shader is rendered under the particles.
  // Set to `false` for a plain black background.
  const SHOW_BACKGROUND_SHADER = false;

  const particleBufferSize = PARTICLE_COUNT * 3 * 4; // 3 floats per particle (x,y,life)
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });

  // params buffer for compute (dt, speed, eps, maxStep, rotateFlag)
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  // shared WGSL snippets used by both fragment and compute shaders
  const commonWgsl = /* wgsl */ `
    ${noiseWgsl}
    ${hsv2rgbWgsl}

    struct Uniforms {
      width: f32,
      height: f32,
      seed: u32,
      scale: f32,
      x: f32,
      y: f32,
      z: f32,
      zoom: f32,
      rotate: f32,
    };

    @group(0) @binding(0) var<uniform> data: Uniforms;

    const angleSaturationScale: f32 = 4.0;
    const tintStrength: f32 = 0.75;
    const PI: f32 = 3.141592653589793;

    // ensure we never divide by zero when using data.scale in shaders
    fn safeScale() -> f32 {
      return max(data.scale, 1e-6);
    }

    ${openSimplex3dWgsl}
  `;


  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;

  const module = device.createShaderModule({ label: "flowfield shader", code: fragmentWgsl });

  const computeWgsl = `${commonWgsl}\n${computeWgslRaw.replace(/\$\{PARTICLE_COUNT\}i/g, `${PARTICLE_COUNT}i`)}`;

  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'cs' } });
  const computeInitPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'init' } });


  // Particle render pipeline (points)
  // Render each particle as an instanced quad (two triangles) so we can control pixel size.
  // Increase `PARTICLE_PIXEL_SIZE` to make dots larger (user requested ~5x).
  const PARTICLE_PIXEL_SIZE = 5.0;

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(/\$\{PARTICLE_PIXEL_SIZE\}/g, `${PARTICLE_PIXEL_SIZE}`)}`;

  // compute bind groups (created later after `dataBuffer` is available`);

  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particlePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: particleModule, entryPoint: 'vs', buffers: [] },
    fragment: { module: particleModule, entryPoint: 'fs', targets: [{ format: presentationFormat, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
    primitive: { topology: 'triangle-list' },
    multisample: { count: 1 },
  });

  // particle render bind groups will be created after `dataBuffer` is available

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  // --- accumulation textures for particle trails (ping-pong) ---
  const accTextureA = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });
  const accTextureB = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });

  // offscreen background texture so composite shader can sample both bg and accumulation
  const bgTexture = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });

  const linearSampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });

  // clear accTextureA to black initially
  {
    const enc = device.createCommandEncoder();
    const rpd: GPURenderPassDescriptor = { colorAttachments: [{ view: accTextureA.createView(), clearValue: [0,0,0,0], loadOp: 'clear', storeOp: 'store' }] };
    const rp = enc.beginRenderPass(rpd);
    rp.end();
    device.queue.submit([enc.finish()]);
  }

  // clear bgTexture to black initially
  {
    const enc = device.createCommandEncoder();
    const rpd: GPURenderPassDescriptor = { colorAttachments: [{ view: bgTexture.createView(), clearValue: [0,0,0,1], loadOp: 'clear', storeOp: 'store' }] };
    const rp = enc.beginRenderPass(rpd);
    rp.end();
    device.queue.submit([enc.finish()]);
  }

  // fade pass shader: samples previous accumulation and multiplies by fade factor
  const accFadeWgsl = /* wgsl */ `${commonWgsl}
    @group(0) @binding(1) var samp: sampler;
    @group(0) @binding(2) var prevTex: texture_2d<f32>;

    @vertex fn vs2(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment fn fs2(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
      let uv = coord.xy / vec2f(data.width, data.height);
      let prev = textureSample(prevTex, samp, uv);
      // Separate fade for color vs alpha:
      // - color (RGB) fades slower so bright highlights persist longer
      // - alpha fades faster so the darker lingering trail becomes more transparent
      let fadeRGB = 0.995;
      let fadeA = 0.92;
      return vec4f(prev.xyz * fadeRGB, prev.w * fadeA);
    }
  `;

  const accFadeModule = device.createShaderModule({ code: accFadeWgsl });
  const accFadePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: accFadeModule, entryPoint: 'vs2' },
    fragment: { module: accFadeModule, entryPoint: 'fs2', targets: [{ format: presentationFormat }] },
    primitive: { topology: 'triangle-list' },
  });

  // composite pipeline: draw accumulation texture over swapchain (alpha blend)
  // composite shader: sample background and accumulation, multiply them and output to swapchain
  const compositeWgsl = /* wgsl */ `${commonWgsl}
    @group(0) @binding(1) var samp2: sampler;
    @group(0) @binding(2) var bgTex: texture_2d<f32>;
    @group(0) @binding(3) var accTex: texture_2d<f32>;
    @vertex fn vs3(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }
    @fragment fn fs3(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
      let uv = coord.xy / vec2f(data.width, data.height);
      let bg = textureSample(bgTex, samp2, uv);
      let acc = textureSample(accTex, samp2, uv);
      // Screen blend (Photoshop 'Screen'):
      // out = 1 - (1 - bg) * (1 - src)
      // use accumulation color modulated by its alpha as the source strength
      let src = acc.rgb * acc.a;
      let one = vec3f(1.0, 1.0, 1.0);
      let outRgb = one - (one - bg.rgb) * (one - src);
      return vec4f(outRgb, 1.0);
    }
  `;

  const compositeModule = device.createShaderModule({ code: compositeWgsl });
  const compositePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: compositeModule, entryPoint: 'vs3' },
    fragment: { module: compositeModule, entryPoint: 'fs3', targets: [{ format: presentationFormat }] },
    primitive: { topology: 'triangle-list' },
  });

  // bind groups for accumulation sampling/composite (we'll select correct views per frame)
  // Note: `accFadeWgsl` and `compositeWgsl` don't reference `data` in their fragment entry points,
  // so the pipeline reflection may omit binding 0. Create bind groups with only sampler (1) and texture (2).
  let accBindA = device.createBindGroup({ layout: accFadePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: accTextureA.createView() } ] });
  let accBindB = device.createBindGroup({ layout: accFadePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: accTextureB.createView() } ] });
  let compositeBindA = device.createBindGroup({ layout: compositePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: bgTexture.createView() }, { binding: 3, resource: accTextureA.createView() } ] });
  let compositeBindB = device.createBindGroup({ layout: compositePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: bgTexture.createView() }, { binding: 3, resource: accTextureB.createView() } ] });

  // Now create compute and render bind groups that reference the canonical `dataBuffer`
  const computeBindGroupA = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
      { binding: 2, resource: { buffer: particleBufferB } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  const computeBindGroupB = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
      { binding: 2, resource: { buffer: particleBufferA } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  // create an init bind group matching the computeInitPipeline's layout
  // The 'init' entry in the compute shader only references binding 0 (data) and binding 2 (particlesOut),
  // so create the bind group with only those entries to match pipeline reflection.
  const computeInitBindGroup = device.createBindGroup({
    layout: computeInitPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 2, resource: { buffer: particleBufferA } },
    ],
  });

  const particleRenderBindA = device.createBindGroup({
    layout: particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
    ],
  });

  const particleRenderBindB = device.createBindGroup({
    layout: particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
  };

  const api = {
    async init() {
      // ensure uniforms are initialized before running the GPU init so data.scale/etc are valid
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      // seed particles on the GPU once at startup
      const encoder = device.createCommandEncoder();
      const cpass = encoder.beginComputePass();
      cpass.setPipeline(computeInitPipeline);
      // write into particleBufferA via the init bind group
      cpass.setBindGroup(0, computeInitBindGroup);
      cpass.dispatchWorkgroups(WORKGROUPS);
      cpass.end();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();

      // copy seeded A->B so both buffers contain a useful initial state
      try {
        const encCopy = device.createCommandEncoder();
        encCopy.copyBufferToBuffer(particleBufferA, 0, particleBufferB, 0, particleBufferSize);
        device.queue.submit([encCopy.finish()]);
        await device.queue.onSubmittedWorkDone();
      } catch (e) {
        console.warn('seed copy A->B failed', e);
      }




      return device.queue.onSubmittedWorkDone();
    },
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
        rotate?: boolean | number;
        rotation?: number;
      }
    ) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.0005;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      // --- GPU particle integration via compute shader ---
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      // write compute params: dt, speed, eps, maxStep, rotateAngle
      const maxStep = EPS * 0.6;
      // accept either numeric `rotation` (radians) or boolean `rotate` (90deg toggle)
      if (data && typeof (data as any).rotation === 'number') {
        // invert sign so positive rotation in the UI rotates the field the intuitive way
        rotateState = -(data as any).rotation;
      } else if (data && typeof (data as any).rotate !== 'undefined') {
        // boolean 90deg toggle: true -> -90deg to match UI expectation
        rotateState = (data as any).rotate ? -Math.PI / 2.0 : 0.0;
      }
      // ensure the uniform shared data exposes the same rotate value for fragment shaders
      sharedData.rotate = rotateState;
      // write sharedData again so fragment pipelines/readers see the updated rotation this frame
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const paramsArray = new Float32Array([dt, PARTICLE_SPEED, EPS, maxStep, rotateState]);
      device.queue.writeBuffer(paramsBuffer, 0, paramsArray.buffer, paramsArray.byteOffset, paramsArray.byteLength);

      // build a single command encoder with compute then render passes
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "compute+render encoder" });

      const cpass = encoder.beginComputePass();
      cpass.setPipeline(computePipeline);
      cpass.setBindGroup(0, ping ? computeBindGroupA : computeBindGroupB);
      cpass.dispatchWorkgroups(WORKGROUPS);
      cpass.end();
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accSrcView = ping ? accTextureA.createView() : accTextureB.createView();
      const accDstView = ping ? accTextureB.createView() : accTextureA.createView();

      const accPassDesc: GPURenderPassDescriptor = { colorAttachments: [{ view: accDstView, clearValue: [0,0,0,0], loadOp: 'clear', storeOp: 'store' }] };
      const accPass = encoder.beginRenderPass(accPassDesc);
      // fade previous accumulation into dst
      accPass.setPipeline(accFadePipeline);
      accPass.setBindGroup(0, ping ? accBindA : accBindB);
      accPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accPass.setPipeline(particlePipeline);
      accPass.setBindGroup(0, ping ? particleRenderBindA : particleRenderBindB);
      accPass.draw(6, PARTICLE_COUNT);
      accPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const bgView = bgTexture.createView();
      (renderPassDescriptor as any).colorAttachments[0].view = bgView;
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      if (SHOW_BACKGROUND_SHADER) {
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
      }
      // when SHOW_BACKGROUND_SHADER is false we simply clear the bgTexture to black
      pass.end();

      // composite accumulation onto swapchain (sample bgTexture + accumulation and write multiplied result)
      const swapView = context.getCurrentTexture().createView();
      const compDesc: GPURenderPassDescriptor = { colorAttachments: [{ view: swapView, loadOp: 'clear', storeOp: 'store', clearValue: [0,0,0,1] }] };
      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      compPass.setBindGroup(0, ping ? compositeBindB : compositeBindA);
      compPass.draw(6);
      compPass.end();

      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      ping = !ping;
      return device.queue.onSubmittedWorkDone();

      
    }
  };
  return api;
}
