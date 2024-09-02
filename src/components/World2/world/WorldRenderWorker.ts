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
let foo: Uint8Array;
let lerp: (a: number, b: number, weight: number) => number;
let wasm: {
  buffer: { value: Uint8ClampedArray };
  render(width: number, height: number): void;
  default?: any;
  lerp?: (a: number, b: number, weight: number) => number;
  memory?: any;
};
async function setupWasm() {
  wasm = await import("../../../as/build/assembly");
}
setupWasm();

function update() {
  if (!wasm) return setTimeout(update, 0);
  console.log("ok", wasm);
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

  renderWithWasm();

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

function renderWithWasm() {
  const context = offscreenCanvas.getContext("2d") as any;
  wasm.render(
    worldRenderModel.dimensions.width,
    worldRenderModel.dimensions.height
  );
  const imageData = new ImageData(
    worldRenderModel.dimensions.width,
    worldRenderModel.dimensions.height
  );
  imageData.data.set(wasm.buffer.value);
  context.putImageData(imageData, 0, 0);
}

self.onmessage = async (
  event: MessageEvent<{
    model: WorldRenderModel;
    offscreenCanvas?: OffscreenCanvas;
  }>
) => {
  console.log("asm lerp", lerp && lerp(0, 7, 0.27));

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
console.log(self.onmessage);
