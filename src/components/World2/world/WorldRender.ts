import { RenderService, RenderSetup } from "../lib/MultiThreadedRender";
import WorldRenderWorker from "./WorldRenderWorker?worker";

console.log("Load WorldRender");

const singletonWorker = new WorldRenderWorker();
export class WorldRender extends RenderService {
  getRenderWorker(): Worker {
    console.log("get WorldRenderWorker!");
    return singletonWorker;
  }
}

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
    RenderService: WorldRender,
  };
};
