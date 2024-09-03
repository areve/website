import { render } from "../lib/render";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { WorldRenderModel } from "./WorldRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

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
let world: WorldGenerator;

let busy: boolean;
let dirty: boolean = false;

const w = 500;
const h = 50;
const data1 = new ImageData(w, h);
const data2 = new ImageData(w, h);
const data3 = new ImageData(w, h);
const data4 = new ImageData(w, h);

async function update() {
  if (!dirty) return;
  if (busy) return;
  dirty = false;
  busy = true;
  const start = self.performance.now();
  // render(
  //   offscreenCanvas,
  //   worldRenderModel.dimensions,
  //   (x: number, y: number) => pixel(world(x, y, worldRenderModel.frame)),
  //   worldRenderModel.camera
  // );

  offscreenCanvas.width = worldRenderModel.dimensions.width;
  offscreenCanvas.height = worldRenderModel.dimensions.height;

  const array1 = new Uint8ClampedArray(w * h * 4);
  const array2 = new Uint8ClampedArray(w * h * 4);
  const array3 = new Uint8ClampedArray(w * h * 4);
  const array4 = new Uint8ClampedArray(w * h * 4);

  const r = await Promise.all([
    renderPart(t1, array1, 0, 0, w, h),
    renderPart(t2, array2, 0, h, w, h),
    renderPart(t3, array3, 0, h * 2, w, h),
    renderPart(t4, array4, 0, h * 3, w, h),
  ]);

  data1.data.set(r[0]);
  context?.putImageData(data1, 0, 0, 0, 0, w, h);
  data2.data.set(r[1]);
  context?.putImageData(data2, 0, h, 0, 0, w, h);
  data3.data.set(r[2]);
  context?.putImageData(data3, 0, h * 2, 0, 0, w, h);
  data4.data.set(r[3]);
  context?.putImageData(data4, 0, h * 3, 0, 0, w, h);

  const end = self.performance.now();
  self.postMessage({
    frame: worldRenderModel.frame,
    timeTaken: (end - start) / 1000,
  } as FrameUpdated);
  setTimeout(() => {
    busy = false;
    update();
  }, 0);
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

  if (!world || event.data.model.seed !== worldRenderModel?.seed)
    world = makeWorldGenerator(event.data.model.seed);

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
): Promise<Uint8ClampedArray> {
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
    worker.onmessage = (ev: MessageEvent) => {
      // data.data.set(new Uint8ClampedArray(ev.data.buffer));
      // console.log('a')
      // context?.putImageData(data, 0, 0, 0, 0, width, 50);
      resolve(new Uint8ClampedArray(ev.data.buffer));
    };
  });
}
