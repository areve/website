import { setupAccumulationResources } from "./Flowfield/accumulation";
import { setupParticleResources } from "./Flowfield/particle";
import { setupBackgroundResources } from "./Flowfield/background";
import { setupShared as setupSharedResources } from "./Flowfield/shared";
import { copyBuffer } from "./Flowfield/buffer";
import { clearTextureToBlack } from "./Flowfield/texture";
import { setupWebGpu } from "./Flowfield/webgpu";
import { setupCompositeResources } from "./Flowfield/composite";

export async function setupFlowfieldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  canvas.width = options.width;
  canvas.height = options.height;

  const webGpu = await setupWebGpu(canvas);
  const { device, context, presentationFormat } = webGpu;
  const { dataBuffer, sharedData } = setupSharedResources(device, options);
  const { colorAttachment, renderPassDescriptor } = setupColorAttachments();

  const background = setupBackgroundResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer
  );

  const particle = setupParticleResources(
    device,
    presentationFormat,
    dataBuffer
  );

  const accumulation = setupAccumulationResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer
  );

  const composite = setupCompositeResources(
    device,
    presentationFormat,
    dataBuffer,
    background.texture,
    accumulation.textureA,
    accumulation.textureB,
    accumulation.sampler
  );

  const config = (() => {
    const workgroupSize = 64;
    return {
      particleSpeed: 2.5,
      workgroupSize,
      workgroups: Math.ceil(particle.config.particleCount / workgroupSize),
      eps: 0.25,
      showBackgroundShader: true,
    } as const;
  })();

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

  const api = {
    async init() {
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const encoder = device.createCommandEncoder();
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(particle.pipelines.computeInit);
      computePass.setBindGroup(0, particle.bindGroups.computeInitBindGroup);
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await copyBuffer(
        device,
        particle.buffers.particleBufferA,
        particle.buffers.particleBufferB
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
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

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
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const paramsArray = new Float32Array([
        deltaTime,
        config.particleSpeed,
        config.eps,
        maxStep,
        rotateState,
      ]);
      device.queue.writeBuffer(
        particle.buffers.paramsBuffer,
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
      computePass.setPipeline(particle.pipelines.compute);
      computePass.setBindGroup(
        0,
        ping ? particle.bindGroups.computeA : particle.bindGroups.computeB
      );
      computePass.dispatchWorkgroups(config.workgroups);
      computePass.end();
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accumulationDstView = ping
        ? accumulation.textureB.createView()
        : accumulation.textureA.createView();
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
      accumulationPass.setPipeline(accumulation.pipeline);
      accumulationPass.setBindGroup(
        0,
        ping ? accumulation.bindGroupA : accumulation.bindGroupB
      );
      accumulationPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accumulationPass.setPipeline(particle.pipelines.particle);
      accumulationPass.setBindGroup(
        0,
        ping
          ? particle.bindGroups.particleRenderA
          : particle.bindGroups.particleRenderB
      );
      accumulationPass.draw(6, particle.config.particleCount);
      accumulationPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const backgroundView = background.texture.createView();
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
      compPass.setPipeline(composite.pipeline);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      compPass.setBindGroup(
        0,
        ping ? composite.bindGroupB : composite.bindGroupA
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
