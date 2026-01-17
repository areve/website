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

  const webGpu = await setupWebGpu(canvas);
  const { device, context, presentationFormat } = webGpu;
  const buffers = setupBuffers(device, sharedData, config.particleCount);

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  const pipelines = setupPipelines(
    device,
    presentationFormat,
    config.particleCount,
    config.particlePixelSize
  );

  const textures = setupTextures(
    device,
    options.width,
    options.height,
    presentationFormat
  );

  clearTextureToBlack(device, textures.accumulationA);
  clearTextureToBlack(device, textures.background);

  const bindGroups = setupBindGroups(device, pipelines, buffers, textures);
  const { colorAttachment, renderPassDescriptor } = setupColorAttachments();

  const api = {
    async init() {
      device.queue.writeBuffer(buffers.dataBuffer, 0, sharedData.asBuffer());
      const encoder = device.createCommandEncoder();
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(pipelines.computeInit);
      computePass.setBindGroup(0, bindGroups.computeInit);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await copyBuffer(
        device,
        buffers.particleBufferA,
        buffers.particleBufferB
      );
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
      device.queue.writeBuffer(buffers.dataBuffer, 0, sharedData.asBuffer());

      // --- GPU particle integration via compute shader ---
      const now = performance.now();
      const deltaTime = Math.max(0.001, (now - lastFrameTime) / 1000);
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
      device.queue.writeBuffer(buffers.dataBuffer, 0, sharedData.asBuffer());
      const paramsArray = new Float32Array([
        deltaTime,
        config.particleSpeed,
        config.eps,
        maxStep,
        rotateState,
      ]);
      device.queue.writeBuffer(
        buffers.paramsBuffer,
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
      computePass.setPipeline(pipelines.compute);
      computePass.setBindGroup(
        0,
        ping ? bindGroups.computeA : bindGroups.computeB
      );
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accumulationDstView = ping
        ? textures.accumulationB.createView()
        : textures.accumulationA.createView();
      const accumulationPassDesc: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: accumulationDstView,
            clearValue: [0, 0, 0, 0],
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      };
      const accumulationPass = encoder.beginRenderPass(accumulationPassDesc);
      // fade previous accumulation into dst
      accumulationPass.setPipeline(pipelines.accumulationFade);
      accumulationPass.setBindGroup(
        0,
        ping ? bindGroups.accumulationA : bindGroups.accumulationB
      );
      accumulationPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accumulationPass.setPipeline(pipelines.particle);
      accumulationPass.setBindGroup(
        0,
        ping ? bindGroups.particleRenderA : bindGroups.particleRenderB
      );
      accumulationPass.draw(6, config.particleCount);
      accumulationPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const backgroundView = textures.background.createView();
      (renderPassDescriptor as any).colorAttachments[0].view = backgroundView;
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      if (config.showBackgroundShader) {
        pass.setPipeline(pipelines.pipeline);
        pass.setBindGroup(0, bindGroups.bindGroup);
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
      compPass.setPipeline(pipelines.composite);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      compPass.setBindGroup(
        0,
        ping ? bindGroups.compositeB : bindGroups.compositeA
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

async function setupWebGpu(canvasEl: HTMLCanvasElement) {
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
    particleBufferA,
    particleBufferB,
    paramsBuffer,
    dataBuffer,
  };
}

export function setupPipelines(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  particleCount: number,
  particlePixelSize: number
) {
  const commonWgsl = commonWgslRaw;
  const fragmentWgsl = `${commonWgsl}\n${fragmentWgslRaw}`;
  const module = device.createShaderModule({
    label: "flowfield shader",
    code: fragmentWgsl,
  });

  const computeWgsl = `${commonWgsl}\n${computeWgslRaw.replace(
    /\$\{particleCount\}i/g,
    `${particleCount}i`
  )}`;
  const computeModule = device.createShaderModule({ code: computeWgsl });
  const compute = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs" },
  });
  const computeInit = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "init" },
  });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(
    /\$\{particlePixelSize\}/g,
    `${particlePixelSize}`
  )}`;
  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particle = device.createRenderPipeline({
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
  const accumulationFade = device.createRenderPipeline({
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
  const composite = device.createRenderPipeline({
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
    compute,
    computeInit,
    particle,
    pipeline,
    accumulationFade,
    composite,
  };
}

function setupBindGroups(
  device: GPUDevice,
  pipelines: {
    pipeline: GPURenderPipeline;
    accumulationFade: GPURenderPipeline;
    composite: GPURenderPipeline;
    compute: GPUComputePipeline;
    computeInit: GPUComputePipeline;
    particle: GPURenderPipeline;
  },
  buffers: {
    particleBufferA: GPUBuffer;
    particleBufferB: GPUBuffer;
    paramsBuffer: GPUBuffer;
    dataBuffer: GPUBuffer;
  },
  textures: {
    accumulationA: GPUTexture;
    accumulationB: GPUTexture;
    background: GPUTexture;
    sampler: GPUSampler;
  }
) {
  const bindGroup = device.createBindGroup({
    layout: pipelines.pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: buffers.dataBuffer } }],
  });

  const accumulationA = device.createBindGroup({
    layout: pipelines.accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.sampler },
      { binding: 2, resource: textures.accumulationA.createView() },
    ],
  });
  const accumulationB = device.createBindGroup({
    layout: pipelines.accumulationFade.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.sampler },
      { binding: 2, resource: textures.accumulationB.createView() },
    ],
  });

  const compositeA = device.createBindGroup({
    layout: pipelines.composite.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.sampler },
      { binding: 2, resource: textures.background.createView() },
      { binding: 3, resource: textures.accumulationA.createView() },
    ],
  });
  const compositeB = device.createBindGroup({
    layout: pipelines.composite.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: textures.sampler },
      { binding: 2, resource: textures.background.createView() },
      { binding: 3, resource: textures.accumulationB.createView() },
    ],
  });

  const computeA = device.createBindGroup({
    layout: pipelines.compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
      { binding: 2, resource: { buffer: buffers.particleBufferB } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });
  const computeB = device.createBindGroup({
    layout: pipelines.compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
      { binding: 3, resource: { buffer: buffers.paramsBuffer } },
    ],
  });

  const computeInit = device.createBindGroup({
    layout: pipelines.computeInit.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 2, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  const particleRenderA = device.createBindGroup({
    layout: pipelines.particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferB } },
    ],
  });
  const particleRenderB = device.createBindGroup({
    layout: pipelines.particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dataBuffer } },
      { binding: 1, resource: { buffer: buffers.particleBufferA } },
    ],
  });

  return {
    bindGroup,
    accumulationA,
    accumulationB,
    compositeA,
    compositeB,
    computeA,
    computeB,
    computeInit,
    particleRenderA,
    particleRenderB,
  };
}

function setupTextures(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat
) {
  const accumulationA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const accumulationB = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const background = device.createTexture({
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
    accumulationA,
    accumulationB,
    background,
    sampler,
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
