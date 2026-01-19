import { setupSharedResources } from "./Flowfield2/shared";
import { setupWebGpu } from "./Flowfield2/webgpu";
import {
  renderBackgroundToTexture,
  setupBackgroundResources,
} from "./Flowfield2/background";
import { presentBackgroundTexture as renderComposite, setupCompositeResources } from "./Flowfield2/composite";

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

  const composite = setupCompositeResources(
    device,
    presentationFormat,
    dataBuffer,
    background
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
      sharedData.z = time * 0.0;

      Object.assign(sharedData, data);
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      const encoder = device.createCommandEncoder();

      renderBackgroundToTexture(encoder, background);
      renderComposite(encoder, context, composite);

      device.queue.submit([encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
