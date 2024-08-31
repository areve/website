import { render } from "../lib/render";
import { makeWorldGenerator } from "./world";

let busy = false;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

//TODO improve types
let world: {
  dimensions?: any;
  pixel: any;
  camera?: any;
  frame?: number;
};

self.onmessage = (event: MessageEvent<any>) => {
  if (event.data.canvas) {
    canvas = event.data.canvas;
    context = canvas.getContext("2d");
    world = makeWorldGenerator(event.data);
  }
  if (!context) return;

  // TODO messy, no types!
  Object.assign(world, event.data)


  if (busy) return;
  busy = true;

  // TODO what a mess!
  render(canvas, event.data.dimensions, world.pixel, event.data.camera);
  setTimeout(() => {
    busy = false;
  }, 0);
};
