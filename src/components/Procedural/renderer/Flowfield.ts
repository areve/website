import {
  updateAccumulation,
  setupAccumulationResources,
} from "./Flowfield/accumulation";
import {
  updateParticles,
  setupParticleResources,
  dispatchParticleComputePass,
} from "./Flowfield/particle";
import {
  renderBackgroundToTexture,
  setupBackgroundResources,
} from "./Flowfield/background";
import { setupShared as setupSharedResources } from "./Flowfield/shared";
import { copyBuffer } from "./Flowfield/buffer";
import { setupWebGpu } from "./Flowfield/webgpu";
import {
  composeToSwapchain,
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
      const now = performance.now();
      const deltaTime = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      Object.assign(sharedData, data);
      sharedData.z = time * 0.0005;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      const encoder = device.createCommandEncoder({
        label: "compute & render encoder",
      });
      renderBackgroundToTexture(encoder, background);
      const rotateState = doRotationStuff(sharedData);

      updateParticles(device, particle, deltaTime, rotateState);
      dispatchParticleComputePass(encoder, particle, ping);
      updateAccumulation(encoder, accumulation, particle, ping);
      composeToSwapchain(encoder, context, composite, ping);

      device.queue.submit([encoder.finish()]);
      ping = !ping;
      return device.queue.onSubmittedWorkDone();
    },
  };
  return api;
}

function doRotationStuff(sharedData: { rotate: any; rotation?: any }) {
  let rotateState = 0.0;
  if (typeof sharedData?.rotation === "number") {
    // invert sign so positive rotation in the UI rotates the field the intuitive way
    rotateState = -sharedData.rotation;
  } else if (typeof sharedData?.rotate !== "undefined") {
    // boolean 90deg toggle: true -> -90deg to match UI expectation
    rotateState = sharedData.rotate ? -Math.PI / 2.0 : 0.0;
  }
  sharedData.rotate = rotateState;
  return rotateState;
}
