import { render } from "./lib/render";
import { makeWorld } from "./world/world";

const world = makeWorld(12345);

console.log("RenderWorker started");

let busy = false;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

self.onmessage = (event: MessageEvent<any>) => {
  if (event.data.canvas) {
    canvas = event.data.canvas;
    context = canvas.getContext("2d");
  }
  if (!context) return;

  if (event.data.props) {
    world.camera = event.data.props.camera;
    world.dimensions = event.data.props.dimensions;
    world.frame = event.data.props.frame;
  }

  if (busy) return;
  busy = true;
  render(canvas, world.dimensions, world.pixel, world.camera);
  setTimeout(() => {
    busy = false;
  }, 0);
};
