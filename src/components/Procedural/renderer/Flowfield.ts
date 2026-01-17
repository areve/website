import commonWgslRaw from "../lib/wgsl/common.wgsl?raw";
import fragmentWgslRaw from "./Flowfield/wgsl/fragment.wgsl?raw";
import computeWgslRaw from "./Flowfield/wgsl/compute.wgsl?raw";
import particleWgslRaw from "./Flowfield/wgsl/particle.wgsl?raw";
import accFadeWgslRaw from "../lib/wgsl/accFade.wgsl?raw";
import compositeWgslRaw from "../lib/wgsl/composite.wgsl?raw";

export async function setupFlowfieldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const config = (() => {
    const particleCount = 5000;
    const workgroupSize = 64;
    return {
      particleCount,
      particleSpeed: 2.5,
      particlePixelSize: 5.0,
      workgroupSize,
      workgroups: Math.ceil(particleCount / workgroupSize),
      eps: 0.25,
      showBackgroundShader: false,
    } as const;
  })();

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

  const { device, context, presentationFormat } = await setupDeviceAndContext(
    canvas
  );
  const {
    particleBufferSize,
    particleBufferA,
    particleBufferB,
    paramsBuffer,
    dataBuffer,
  } = setupBuffers(device, sharedData, config.particleCount);

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  const {
    module,
    computeModule,
    computePipeline,
    computeInitPipeline,
    particleModule,
    particlePipeline,
    pipeline,
    accFadePipeline,
    compositePipeline,
  } = setupPipelines(
    device,
    presentationFormat,
    config.particleCount,
    config.particlePixelSize
  );

  const {
    accumulationTextureA,
    accumulationTextureB,
    backgroundTexture,
    linearSampler,
  } = setupTextures(device, options.width, options.height, presentationFormat);

  clearTextureToBlack(device, accumulationTextureA);
  clearTextureToBlack(device, backgroundTexture);

  const {
    bindGroup,
    accumulationBindGroupA,
    accumulationBindGroupB,
    compositeBindGroupA,
    compositeBindGroupB,
    computeBindGroupA,
    computeBindGroupB,
    computeInitBindGroup,
    particleRenderBindGroupA,
    particleRenderBindGroupB,
  } = setupBindGroups(
    device,
    {
      pipeline,
      accFadePipeline,
      compositePipeline,
      computePipeline,
      computeInitPipeline,
      particlePipeline,
    },
    { dataBuffer, particleBufferA, particleBufferB, paramsBuffer },
    {
      accumulationTextureA,
      accumulationTextureB,
      backgroundTexture,
      linearSampler,
    }
  );

  const { colorAttachment, renderPassDescriptor } = setupColorAttachments();

  const api = {
    async init() {
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const encoder = device.createCommandEncoder();
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computeInitPipeline);
      computePass.setBindGroup(0, computeInitBindGroup);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await copyBuffer(device, particleBufferA, particleBufferB);
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
      const maxStep = config.eps * 0.6;
      // accept either numeric `rotation` (radians) or boolean `rotate` (90deg toggle)
      if (data && typeof (data as any).rotation === "number") {
        // invert sign so positive rotation in the UI rotates the field the intuitive way
        rotateState = -(data as any).rotation;
      } else if (data && typeof (data as any).rotate !== "undefined") {
        // boolean 90deg toggle: true -> -90deg to match UI expectation
        rotateState = (data as any).rotate ? -Math.PI / 2.0 : 0.0;
      }
      // ensure the uniform shared data exposes the same rotate value for fragment shaders
      sharedData.rotate = rotateState;
      // write sharedData again so fragment pipelines/readers see the updated rotation this frame
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const paramsArray = new Float32Array([
        dt,
        config.particleSpeed,
        config.eps,
        maxStep,
        rotateState,
      ]);
      device.queue.writeBuffer(
        paramsBuffer,
        0,
        paramsArray.buffer,
        paramsArray.byteOffset,
        paramsArray.byteLength
      );

      // build a single command encoder with compute then render passes
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "compute+render encoder",
      });

      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, ping ? computeBindGroupA : computeBindGroupB);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accumulationSrcView = ping
        ? accumulationTextureA.createView()
        : accumulationTextureB.createView();
      const accumulationDstView = ping
        ? accumulationTextureB.createView()
        : accumulationTextureA.createView();

      const accPassDesc: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: accumulationDstView,
            clearValue: [0, 0, 0, 0],
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      };
      const accumulationPass = encoder.beginRenderPass(accPassDesc);
      // fade previous accumulation into dst
      accumulationPass.setPipeline(accFadePipeline);
      accumulationPass.setBindGroup(
        0,
        ping ? accumulationBindGroupA : accumulationBindGroupB
      );
      accumulationPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accumulationPass.setPipeline(particlePipeline);
      accumulationPass.setBindGroup(
        0,
        ping ? particleRenderBindGroupA : particleRenderBindGroupB
      );
      accumulationPass.draw(6, config.particleCount);
      accumulationPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const bgView = backgroundTexture.createView();
      (renderPassDescriptor as any).colorAttachments[0].view = bgView;
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      if (config.showBackgroundShader) {
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
      }
      // when SHOW_BACKGROUND_SHADER is false we simply clear the bgTexture to black
      pass.end();

      // composite accumulation onto swapchain (sample bgTexture + accumulation and write multiplied result)
      const swapView = context.getCurrentTexture().createView();
      const compDesc: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: swapView,
            loadOp: "clear",
            storeOp: "store",
            clearValue: [0, 0, 0, 1],
          },
        ],
      };
      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      compPass.setBindGroup(
        0,
        ping ? compositeBindGroupB : compositeBindGroupA
      );
      compPass.draw(6);
      compPass.end();

      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      ping = !ping;
      return device.queue.onSubmittedWorkDone();
    },
  };
  return api;
}

async function setupDeviceAndContext(canvasEl: HTMLCanvasElement) {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) throw new Error("need a browser that supports WebGPU");
  const context = canvasEl.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: presentationFormat });
  return { device, context, presentationFormat };
}

function setupBuffers(
  device: GPUDevice,
  sharedData: any,
  particleCount: number
) {
  const particleBufferSize = particleCount * 3 * 4; // 3 floats per particle (x,y,life)
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  return {
    particleBufferSize,
    particleBufferA,
    particleBufferB,
    paramsBuffer,
    dataBuffer,
  };
}

export function setupPipelines(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  PARTICLE_COUNT: number,
  PARTICLE_PIXEL_SIZE: number
) {
  const commonWgsl = commonWgslRaw;
  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;
  const module = device.createShaderModule({
    label: "flowfield shader",
    code: fragmentWgsl,
  });

  const computeWgsl = `${commonWgsl}\n${computeWgslRaw.replace(
    /\$\{PARTICLE_COUNT\}i/g,
    `${PARTICLE_COUNT}i`
  )}`;
  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs" },
  });
  const computeInitPipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "init" },
  });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(
    /\$\{PARTICLE_PIXEL_SIZE\}/g,
    `${PARTICLE_PIXEL_SIZE}`
  )}`;
  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particlePipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: particleModule, entryPoint: "vs", buffers: [] },
    fragment: {
      module: particleModule,
      entryPoint: "fs",
      targets: [
        {
          format: presentationFormat,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
    multisample: { count: 1 },
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format: presentationFormat }] },
  });

  const accFadeWgsl = `${commonWgsl}\n${accFadeWgslRaw}`;
  const accFadeModule = device.createShaderModule({ code: accFadeWgsl });
  const accFadePipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: accFadeModule, entryPoint: "vs2" },
    fragment: {
      module: accFadeModule,
      entryPoint: "fs2",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const compositeWgsl = `${commonWgsl}\n${compositeWgslRaw}`;
  const compositeModule = device.createShaderModule({ code: compositeWgsl });
  const compositePipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: compositeModule, entryPoint: "vs3" },
    fragment: {
      module: compositeModule,
      entryPoint: "fs3",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  return {
    module,
    computeModule,
    computePipeline,
    computeInitPipeline,
    particleModule,
    particlePipeline,
    pipeline,
    accFadePipeline,
    compositePipeline,
  };
}

function setupBindGroups(
  device: GPUDevice,
  pipelines: {
    pipeline: GPURenderPipeline;
    accFadePipeline: GPURenderPipeline;
    compositePipeline: GPURenderPipeline;
    computePipeline: GPUComputePipeline;
    computeInitPipeline: GPUComputePipeline;
    particlePipeline: GPURenderPipeline;
  },
  buffers: any,
  textures: any
) {
  const bindGroup = device.createBindGroup({
    layout: pipelines.pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }],
  });

  const accumulationBindGroupA = device.createBindGroup({
    layout: pipelines.accFadePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.linearSampler },
      { binding: 2, resource: textures.accumulationTextureA.createView() },
    ],
  });
  const accumulationBindGroupB = device.createBindGroup({
    layout: pipelines.accFadePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.linearSampler },
      { binding: 2, resource: textures.accumulationTextureB.createView() },
    ],
  });

  const compositeBindGroupA = device.createBindGroup({
    layout: pipelines.compositePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.linearSampler },
      { binding: 2, resource: textures.backgroundTexture.createView() },
      { binding: 3, resource: textures.accumulationTextureA.createView() },
    ],
  });
  const compositeBindGroupB = device.createBindGroup({
    layout: pipelines.compositePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.linearSampler },
      { binding: 2, resource: textures.backgroundTexture.createView() },
      { binding: 3, resource: textures.accumulationTextureB.createView() },
    ],
  });

  const computeBindGroupA = device.createBindGroup({
    layout: pipelines.computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
      { binding: 2, resource: { buffer: buffers.particleBufferB } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });
  const computeBindGroupB = device.createBindGroup({
    layout: pipelines.computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });

  const computeInitBindGroup = device.createBindGroup({
    layout: pipelines.computeInitPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  const particleRenderBindGroupA = device.createBindGroup({
    layout: pipelines.particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
    ],
  });
  const particleRenderBindGroupB = device.createBindGroup({
    layout: pipelines.particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  return {
    bindGroup,
    accumulationBindGroupA,
    accumulationBindGroupB,
    compositeBindGroupA,
    compositeBindGroupB,
    computeBindGroupA,
    computeBindGroupB,
    computeInitBindGroup,
    particleRenderBindGroupA,
    particleRenderBindGroupB,
  };
}

function setupTextures(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat
) {
  const accumulationTextureA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const accumulationTextureB = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const backgroundTexture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear",
  });
  return {
    accumulationTextureA,
    accumulationTextureB,
    backgroundTexture,
    linearSampler: sampler,
  };
}

function clearTextureToBlack(device: GPUDevice, texture: GPUTexture) {
  const commandEncoder = device.createCommandEncoder();
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: texture.createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);
}

async function copyBuffer(
  device: GPUDevice,
  bufferA: GPUBuffer,
  bufferB: GPUBuffer
) {
  try {
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(bufferA, 0, bufferB, 0, bufferA.size);
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  } catch (e) {
    console.warn("seed copy A->B failed", e);
  }
}

function setupColorAttachments() {
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
  return { colorAttachment, renderPassDescriptor };
}
