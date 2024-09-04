import { RenderService, RenderSetup } from "../lib/MultiThreadedRender";
import WorldRenderWorker from "./WorldRenderWorker?worker";

let singletonWorker: Worker;

export const makeWorld = (seed: number): RenderSetup => {
  return {
    model: {
      title: "World",
      seed,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: false,
    },
    renderService: () => {
      singletonWorker ??= new WorldRenderWorker();
      return new RenderService(singletonWorker);
    },
  };
};
