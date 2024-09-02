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
async function setupWasm() {
  const wasm = await import("../../../as/build/assembly");

  lerp = wasm.lerp;
  const abc = wasm.bar();
  const memory = wasm.memory;
  // const byteOffset = wasm.memory._getByteOffset()

  console.log("wasm.memory", abc, new Uint8Array(wasm.memory.buffer));
  console.log("wasm.ary", wasm.ary.value.slice(0, 5));

  foo = wasm.ary.value;
}
setupWasm();

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

  if (foo) {
    const imageData = new ImageData(100, 100);
    imageData.data.set(foo);
    const context = offscreenCanvas.getContext("2d") as any;
    context.putImageData(imageData, 0, 0);
  }

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
