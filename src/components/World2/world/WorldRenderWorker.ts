import { render } from "../lib/render";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { WorldRenderProps } from "./WorldRender";

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

let worldProps: WorldRenderProps;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;
let world: WorldGenerator;
let frameId: number;

function update() {
  worldProps.frame++;
  const start = self.performance.now();
  render(
    canvas,
    worldProps.dimensions,
    (x: number, y: number) => pixel(world(x, y, worldProps.frame)),
    worldProps.camera
  );
  const end = self.performance.now();
  self.postMessage({
    frame: worldProps.frame,
    timeTaken: (end - start) / 1000,
  } as FrameUpdated);
  frameId = requestAnimationFrame(update);
}

self.onmessage = (event: MessageEvent<WorldRenderProps>) => {
  worldProps = event.data;
  if (worldProps.canvas) {
    canvas = worldProps.canvas;
    context = canvas.getContext("2d");
    world = makeWorldGenerator(worldProps.seed);
    frameId = requestAnimationFrame(update);
  }
};
