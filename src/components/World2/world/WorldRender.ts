import { Dimensions, Camera } from "../lib/render";
import { FrameUpdated } from "./MultiThreadedRender";
import WorldRenderWorker from "./WorldRenderWorker?worker";
import { toRaw } from "vue";

export type RenderServiceConstructor = {
  new (canvas: HTMLCanvasElement, props: RenderModel): RenderService;
};
export interface RenderModel {
  title: string;
  seed: number;
  frame: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  canvas?: OffscreenCanvas;
}

export interface RenderService {
  update(renderProps: RenderModel): void;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;
}

export type WorldRenderModel = RenderModel;

export interface WorldRenderSetup {
  model: WorldRenderModel;
  RenderService?: RenderServiceConstructor;
}

const singleWorker: Worker = new WorldRenderWorker();

export class WorldRender implements RenderService {
  private renderWorker: Worker;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(canvas: HTMLCanvasElement, model: RenderModel) {
    console.log('new WorldRender')
    // if (singleWorker) {
    //   console.log("Debug: terminate hit");
    //   singleWorker.terminate();
    // }

    this.renderWorker = singleWorker;
    this.renderWorker.onmessage = (ev: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(ev.data);
    };
    const offscreenCanvas = canvas.transferControlToOffscreen();
    this.renderWorker.postMessage(
      { model: toRaw(model), canvas: offscreenCanvas },
      [offscreenCanvas]
    );
  }
  update(model: RenderModel): void {
    this.renderWorker.postMessage({ model: toRaw(model) });
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
