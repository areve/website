import {
  RenderModel,
  RenderService,
  RenderServiceConstructor,
} from "../lib/MultiThreadedRender";
import WorldRenderWorker from "./WorldRenderWorker?worker";

export type WorldRenderModel = RenderModel;

export interface WorldRenderSetup {
  model: WorldRenderModel;
  RenderService?: RenderServiceConstructor;
}

export class WorldRender extends RenderService {
  createRenderWorker(): Worker {
    console.log("create WorldRenderWorker!");
    return new WorldRenderWorker();
  }
}

export const makeWorld = (seed: number): WorldRenderSetup => {
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
