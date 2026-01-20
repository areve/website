import { setupSharedResources } from "./Flowfield2/shared";
import { setupWebGpu } from "./Flowfield2/webgpu";
import {
  renderBackgroundToTexture,
  renderNormalsToTexture,
  setupBackgroundResources,
} from "./Flowfield2/background";
import {
  renderComposite,
  setupCompositeResources,
} from "./Flowfield2/composite";
import {
  renderParticleTexture,
  setupParticleResources,
  dispatchParticleCompute,
} from "./Flowfield2/particle";

export async function setupFlowfield2Renderer(
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

  const { device, context, presentationFormat } = await setupWebGpu(canvas);
  const { dataBuffer, sharedData } = setupSharedResources(device, options);

  const background = setupBackgroundResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer
  );

  const particle = setupParticleResources(device, options.width, options.height, dataBuffer);
  const composite = setupCompositeResources(
    device,
    presentationFormat,
    dataBuffer,
    background,
    particle
  );

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      const now = performance.now();
      if (!(this as any)._lastFrameTime) (this as any)._lastFrameTime = now;
      const deltaTime = Math.max(0.001, (now - (this as any)._lastFrameTime) / 1000);
      (this as any)._lastFrameTime = now;

      sharedData.z = time * 0.0;

      Object.assign(sharedData, data);
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      const encoder = device.createCommandEncoder();

      renderBackgroundToTexture(encoder, background);
      renderNormalsToTexture(encoder, background);
      // compute particle advection using normalsTexture
      await Promise.resolve();
      dispatchParticleCompute(encoder, device, dataBuffer, particle, background, deltaTime);
      renderParticleTexture(encoder, particle);
      renderComposite(encoder, context, composite);

      device.queue.submit([encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
