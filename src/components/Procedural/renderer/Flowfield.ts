import { setupAccumulationThings } from "./Flowfield/accumulation";
import { setupParticleThings } from "./Flowfield/particle";
import { setupBackgroundThings } from "./Flowfield/background";

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
      showBackgroundShader: true,
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
  const buffers = setupBuffers(device, sharedData);

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  const particleThings = setupParticleThings(
    device,
    presentationFormat,
    config.particleCount,
    config.particlePixelSize,
    { dataBuffer: buffers.dataBuffer }
  );

  const accumulation = setupAccumulationThings(
    device,
    presentationFormat,
    options.width,
    options.height,
    { dataBuffer: buffers.dataBuffer }
  );

  const background = setupBackgroundThings(device, presentationFormat, {
    dataBuffer: buffers.dataBuffer,
  });

  clearTextureToBlack(device, accumulation.textures.accumulationA);
  clearTextureToBlack(device, accumulation.textures.background);
  const { colorAttachment, renderPassDescriptor } = setupColorAttachments();

  const api = {
    async init() {
      device.queue.writeBuffer(buffers.dataBuffer, 0, sharedData.asBuffer());
      const encoder = device.createCommandEncoder();
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(particleThings.pipelines.computeInit);
      computePass.setBindGroup(0, particleThings.bindGroups.computeInit);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await copyBuffer(device, particleThings.buffers.particleBufferA, particleThings.buffers.particleBufferB);
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
        particleThings.buffers.paramsBuffer,
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
      computePass.setPipeline(particleThings.pipelines.compute);
      computePass.setBindGroup(0, ping ? particleThings.bindGroups.computeA : particleThings.bindGroups.computeB);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accumulationDstView = ping
        ? accumulation.textures.accumulationB.createView()
        : accumulation.textures.accumulationA.createView();
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
      accumulationPass.setPipeline(accumulation.pipelines.accumulationFade);
      accumulationPass.setBindGroup(0, ping ? accumulation.bindGroups.accumulationA : accumulation.bindGroups.accumulationB);
      accumulationPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accumulationPass.setPipeline(particleThings.pipelines.particle);
      accumulationPass.setBindGroup(0, ping ? particleThings.bindGroups.particleRenderA : particleThings.bindGroups.particleRenderB);
      accumulationPass.draw(6, config.particleCount);
      accumulationPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const backgroundView = accumulation.textures.background.createView();
      (renderPassDescriptor as any).colorAttachments[0].view = backgroundView;
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      if (config.showBackgroundShader) {
        pass.setPipeline(background.pipeline);
        pass.setBindGroup(0, background.bindGroup);
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
      compPass.setPipeline(accumulation.pipelines.composite);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      compPass.setBindGroup(0, ping ? accumulation.bindGroups.compositeB : accumulation.bindGroups.compositeA);
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

function setupBuffers(device: GPUDevice, sharedData: any) {
  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  return { dataBuffer };
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

async function copyBuffer(device: GPUDevice, bufferA: GPUBuffer, bufferB: GPUBuffer) {
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
