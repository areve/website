import { render } from "../lib/render";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { WorldRenderProps } from "./WorldRender";

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

let world: WorldGenerator;

let worldProps: WorldRenderProps;
let frameId: number;

function update() {
  const start = self.performance.now();
  render(
    canvas,
    worldProps.dimensions,
    (x: number, y: number) => pixel(world(x, y, worldProps.frame)),
    worldProps.camera
  );
  worldProps.frame++;
  frameId = requestAnimationFrame(update);

  const end = self.performance.now();

  self.postMessage({
    frame: worldProps.frame,
    timeTaken: (end - start) / 1000,
  } as FrameUpdated);
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
