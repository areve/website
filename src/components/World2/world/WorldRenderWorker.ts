import { render } from "../lib/render";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { WorldRenderProps } from "./WorldRenderService";

let busy = false;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

let world: WorldGenerator;

self.onmessage = (event: MessageEvent<WorldRenderProps>) => {
  const worldProps: WorldRenderProps = event.data;
  if (worldProps.canvas) {
    canvas = worldProps.canvas;
    context = canvas.getContext("2d");
    world = makeWorldGenerator(worldProps.seed);
  }
  if (!context) return;

  if (busy) return;
  busy = true;

  render(
    canvas,
    event.data.dimensions,
    (x: number, y: number) => pixel(world(x, y, worldProps.frame)),
    event.data.camera
  );
  setTimeout(() => {
    busy = false;
  }, 0);
};
