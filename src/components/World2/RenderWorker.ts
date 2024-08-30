import { Rgb } from "./lib/color";
import { Camera, Dimensions, render } from "./lib/render";
import { makeWorld } from "./world/world";

const world = makeWorld(12345);

console.log("hello");

let busy = false;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

self.onmessage = (event: MessageEvent<any>) => {
  if (event.data.canvas) {
    canvas = event.data.canvas;
    context = canvas.getContext("2d");
  }

  if (busy) return;
  world.frame++;
  busy = true;
  render(canvas, event.data.dimensions, world.pixel, event.data.camera);
  setTimeout(() => {
    busy = false;
  }, 0);
};
