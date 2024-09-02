import { render } from "../lib/render";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { WorldRenderModel } from "./WorldRender";

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

function update() {
  if (!dirty) return;
  if (busy) return;
  dirty = false;
  busy = true;
  const start = self.performance.now();
  render(
    offscreenCanvas,
    worldRenderModel.dimensions,
    (x: number, y: number) => pixel(world(x, y, worldRenderModel.frame)),
    worldRenderModel.camera
  );

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
