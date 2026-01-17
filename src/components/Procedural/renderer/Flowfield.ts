import commonWgslRaw from '../lib/wgsl/common.wgsl?raw';
import fragmentWgslRaw from './Flowfield/wgsl/fragment.wgsl?raw';
import computeWgslRaw from './Flowfield/wgsl/compute.wgsl?raw';
import particleWgslRaw from './Flowfield/wgsl/particle.wgsl?raw';
import accFadeWgslRaw from '../lib/wgsl/accFade.wgsl?raw';
import compositeWgslRaw from '../lib/wgsl/composite.wgsl?raw';

// Top-level helpers for setup (exported for testability)
export function setupBuffers(device: GPUDevice, sharedData: any, particleCount: number) {
  const particleBufferSize = particleCount * 3 * 4; // 3 floats per particle (x,y,life)
  const particleBufferA = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const particleBufferB = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
  const paramsBuffer = device.createBuffer({ size: 5 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const dataBuffer = device.createBuffer({ size: sharedData.asBuffer().byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  return { particleBufferSize, particleBufferA, particleBufferB, paramsBuffer, dataBuffer };
}

export function setupPipelines(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  commonWgslRaw: string,
  fragmentWgslRaw: string,
  computeWgslRaw: string,
  particleWgslRaw: string,
  accFadeWgslRaw: string,
  compositeWgslRaw: string,
  PARTICLE_COUNT: number,
  PARTICLE_PIXEL_SIZE: number
) {
  const commonWgsl = commonWgslRaw;
  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;
  const module = device.createShaderModule({ label: "flowfield shader", code: fragmentWgsl });

  const computeWgsl = `${commonWgsl}\n${computeWgslRaw.replace(/\$\{PARTICLE_COUNT\}i/g, `${PARTICLE_COUNT}i`)}`;
  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'cs' } });
  const computeInitPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'init' } });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(/\$\{PARTICLE_PIXEL_SIZE\}/g, `${PARTICLE_PIXEL_SIZE}`)}`;
  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particlePipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: particleModule, entryPoint: 'vs', buffers: [] }, fragment: { module: particleModule, entryPoint: 'fs', targets: [{ format: presentationFormat, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] }, primitive: { topology: 'triangle-list' }, multisample: { count: 1 } });

  const pipeline = device.createRenderPipeline({ label: "our hardcoded red line pipeline", layout: "auto", vertex: { module }, fragment: { module, targets: [{ format: presentationFormat }] } });

  const accFadeWgsl = `${commonWgsl}\n${accFadeWgslRaw}`;
  const accFadeModule = device.createShaderModule({ code: accFadeWgsl });
  const accFadePipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: accFadeModule, entryPoint: 'vs2' }, fragment: { module: accFadeModule, entryPoint: 'fs2', targets: [{ format: presentationFormat }] }, primitive: { topology: 'triangle-list' } });

  const compositeWgsl = `${commonWgsl}\n${compositeWgslRaw}`;
  const compositeModule = device.createShaderModule({ code: compositeWgsl });
  const compositePipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: compositeModule, entryPoint: 'vs3' }, fragment: { module: compositeModule, entryPoint: 'fs3', targets: [{ format: presentationFormat }] }, primitive: { topology: 'triangle-list' } });

  return { module, computeModule, computePipeline, computeInitPipeline, particleModule, particlePipeline, pipeline, accFadePipeline, compositePipeline };
}

export function setupBindGroups(
  device: GPUDevice,
  pipelines: any,
  buffers: any,
  textures: any
) {
  const bindGroup = device.createBindGroup({ layout: pipelines.pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }] });

  const accBindA = device.createBindGroup({ layout: pipelines.accFadePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: textures.sampler }, { binding: 2, resource: textures.accA.createView() }] });
  const accBindB = device.createBindGroup({ layout: pipelines.accFadePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: textures.sampler }, { binding: 2, resource: textures.accB.createView() }] });

  const compositeBindA = device.createBindGroup({ layout: pipelines.compositePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: textures.sampler }, { binding: 2, resource: textures.bg.createView() }, { binding: 3, resource: textures.accA.createView() }] });
  const compositeBindB = device.createBindGroup({ layout: pipelines.compositePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: textures.sampler }, { binding: 2, resource: textures.bg.createView() }, { binding: 3, resource: textures.accB.createView() }] });

  const computeBindGroupA = device.createBindGroup({ layout: pipelines.computePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: { buffer: buffers.particleBufferA } }, { binding: 2, resource: { buffer: buffers.particleBufferB } }, { binding: 3, resource: { buffer: buffers.paramsBuffer } }] });
  const computeBindGroupB = device.createBindGroup({ layout: pipelines.computePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: { buffer: buffers.particleBufferB } }, { binding: 2, resource: { buffer: buffers.particleBufferA } }, { binding: 3, resource: { buffer: buffers.paramsBuffer } }] });

  const computeInitBindGroup = device.createBindGroup({ layout: pipelines.computeInitPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 2, resource: { buffer: buffers.particleBufferA } }] });

  const particleRenderBindA = device.createBindGroup({ layout: pipelines.particlePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: { buffer: buffers.particleBufferB } }] });
  const particleRenderBindB = device.createBindGroup({ layout: pipelines.particlePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }, { binding: 1, resource: { buffer: buffers.particleBufferA } }] });

  return { bindGroup, accBindA, accBindB, compositeBindA, compositeBindB, computeBindGroupA, computeBindGroupB, computeInitBindGroup, particleRenderBindA, particleRenderBindB };
}

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
      const buf = new ArrayBuffer(12 * 4);
      const f32 = new Float32Array(buf);
      const u32 = new Uint32Array(buf);
      f32[0] = this.width;
      f32[1] = this.height;
      u32[2] = (this.seed as number) >>> 0;
      f32[3] = this.scale;
      f32[4] = this.x;
      f32[5] = this.y;
      f32[6] = this.z;
      f32[7] = this.zoom;
      f32[8] = this.rotate;
      return f32;
    },
  };

  canvas.width = options.width;
  canvas.height = options.height;

  async function setupDeviceAndContext(canvasEl: HTMLCanvasElement) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice()!;
    if (!device) throw new Error("need a browser that supports WebGPU");
    const context = canvasEl.getContext("webgpu")!;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: presentationFormat });
    return { device, context, presentationFormat };
  }

  let device: GPUDevice;
  let context: GPUCanvasContext;
  let presentationFormat: GPUTextureFormat;
  try {
    const res = await setupDeviceAndContext(canvas);
    device = res.device;
    context = res.context;
    presentationFormat = res.presentationFormat;
  } catch (e) {
    return fail("need a browser that supports WebGPU");
  }

  // --- GPU-driven particle system ---
  const PARTICLE_COUNT = 5000;
  const PARTICLE_SPEED = 2.5;
  const PARTICLE_PIXEL_SIZE = 5.0;
  const WORKGROUP_SIZE = 64;
  const WORKGROUPS = Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE);
  const EPS = 0.25;
  const SHOW_BACKGROUND_SHADER = false;

  const { particleBufferSize, particleBufferA, particleBufferB, paramsBuffer, dataBuffer } = setupBuffers(device, sharedData, PARTICLE_COUNT);

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  const { module, computeModule, computePipeline, computeInitPipeline, particleModule, particlePipeline, pipeline, accFadePipeline, compositePipeline } = setupPipelines(device, presentationFormat, commonWgslRaw, fragmentWgslRaw, computeWgslRaw, particleWgslRaw, accFadeWgslRaw, compositeWgslRaw, PARTICLE_COUNT, PARTICLE_PIXEL_SIZE);

  // --- accumulation and background textures (created via helper for readability)
  function setupTextures(width: number, height: number, format: GPUTextureFormat) {
    const accA = device.createTexture({ size: { width, height, depthOrArrayLayers: 1 }, format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    const accB = device.createTexture({ size: { width, height, depthOrArrayLayers: 1 }, format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    const bg = device.createTexture({ size: { width, height, depthOrArrayLayers: 1 }, format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
    const sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
    return { accA, accB, bg, sampler };
  }
  const { accA: accTextureA, accB: accTextureB, bg: bgTexture, sampler: linearSampler } = setupTextures(options.width, options.height, presentationFormat);

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

  // pipelines (accumulation & composite) created earlier by `setupPipelines`

  const { bindGroup, accBindA, accBindB, compositeBindA, compositeBindB, computeBindGroupA, computeBindGroupB, computeInitBindGroup, particleRenderBindA, particleRenderBindB } = setupBindGroups(device, { pipeline, accFadePipeline, compositePipeline, computePipeline, computeInitPipeline, particlePipeline }, { dataBuffer, particleBufferA, particleBufferB, paramsBuffer }, { accA: accTextureA, accB: accTextureB, bg: bgTexture, sampler: linearSampler });

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
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computeInitPipeline);
      // write into particleBufferA via the init bind group
      computePass.setBindGroup(0, computeInitBindGroup);
      computePass.dispatchWorkgroups(WORKGROUPS);
      computePass.end();
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

      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, ping ? computeBindGroupA : computeBindGroupB);
      computePass.dispatchWorkgroups(WORKGROUPS);
      computePass.end();
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
