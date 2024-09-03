import { MultiThreadedRender } from "./MultiThreadedRender";
import { WorldRenderModel } from "./WorldRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

const mtRender = new MultiThreadedRender();

// mtRender.setThreads()

const t1 = new WorldRenderThreadWorker();
const t2 = new WorldRenderThreadWorker();
const t3 = new WorldRenderThreadWorker();
const t4 = new WorldRenderThreadWorker();

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

let worldRenderModel: WorldRenderModel;
let offscreenCanvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

// let busy: boolean;
let dirty: boolean = false;

const w = 500;
const h = 50;
let array1 = new Uint8ClampedArray(w * h * 4);
let array2 = new Uint8ClampedArray(w * h * 4);
let array3 = new Uint8ClampedArray(w * h * 4);
let array4 = new Uint8ClampedArray(w * h * 4);

async function update() {
  if (!dirty) return;
  // if (busy) return;
  dirty = false;
  // busy = true;
  const start = self.performance.now();

  offscreenCanvas.width = worldRenderModel.dimensions.width;
  offscreenCanvas.height = worldRenderModel.dimensions.height;

  const results = await Promise.all([
    renderPart(t1, array1, 0, 0, w, h),
    renderPart(t2, array2, 0, h, w, h),
    renderPart(t3, array3, 0, h * 2, w, h),
    renderPart(t4, array4, 0, h * 3, w, h),
  ]);

  array1 = new Uint8ClampedArray(results[0]);
  array2 = new Uint8ClampedArray(results[1]);
  array3 = new Uint8ClampedArray(results[2]);
  array4 = new Uint8ClampedArray(results[3]);

  context?.putImageData(new ImageData(array1, w, h), 0, 0, 0, 0, w, h);
  context?.putImageData(new ImageData(array2, w, h), 0, h, 0, 0, w, h);
  context?.putImageData(new ImageData(array3, w, h), 0, h * 2, 0, 0, w, h);
  context?.putImageData(new ImageData(array4, w, h), 0, h * 3, 0, 0, w, h);

  const end = self.performance.now();
  self.postMessage({
    frame: worldRenderModel.frame,
    timeTaken: (end - start) / 1000,
  } as FrameUpdated);
  // setTimeout(() => {
  //   busy = false;
  //   update();
  // }, 0);
}

self.onmessage = async (
  event: MessageEvent<{
    model: WorldRenderModel;
    offscreenCanvas?: OffscreenCanvas;
  }>
) => {
  if (event.data.offscreenCanvas) {
    offscreenCanvas = event.data.offscreenCanvas;
    context = offscreenCanvas.getContext("2d");
  }

  worldRenderModel = event.data.model;
  dirty = true;
  update();
};

function renderPart(
  worker: Worker,
  array: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    worker.postMessage(
      {
        origin: { x, y },
        dimensions: { width, height },
        model: worldRenderModel,
        buffer: array.buffer,
      },
      [array.buffer]
    );
    worker.onmessage = (
      ev: MessageEvent<{
        buffer: ArrayBuffer;
      }>
    ) => resolve(ev.data.buffer);
  });
}
