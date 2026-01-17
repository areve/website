import {
  accumulationDoStuff,
  setupAccumulationResources,
} from "./Flowfield/accumulation";
import { particleDoStuff, setupParticleResources } from "./Flowfield/particle";
import {
  backgroundDoStuff,
  setupBackgroundResources,
} from "./Flowfield/background";
import { setupShared as setupSharedResources } from "./Flowfield/shared";
import { copyBuffer } from "./Flowfield/buffer";
import { clearTextureToBlack } from "./Flowfield/texture";
import { setupWebGpu } from "./Flowfield/webgpu";
import {
  compositeDoStuff,
  setupCompositeResources,
} from "./Flowfield/composite";

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
    return {
      particleSpeed: 2.5,
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
      computePass.dispatchWorkgroups(particle.config.workgroups);
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

      // build a single command encoder with compute then render passes
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "compute+render encoder",
      });

      particleDoStuff(
        ping,
        encoder,
        particle,
        deltaTime,
        data,
        rotateState,
        sharedData,
        dataBuffer,
        device
      );
      accumulationDoStuff(ping, encoder, accumulation, particle);
      backgroundDoStuff(encoder, renderPassDescriptor, background);
      compositeDoStuff(context, encoder, composite, ping);

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
