import { toRaw } from "vue";
import { Dimensions, Camera } from "../lib/render";
import WorldRenderWorker from "./WorldRenderWorker?worker";
import { FrameUpdated } from "./WorldRenderWorker";

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

let singleWorker: Worker;
export class WorldRender implements RenderService {
  private renderWorker: Worker;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(canvas: HTMLCanvasElement, model: RenderModel) {
    if (singleWorker) {
      console.log("Debug: terminate hit");
      singleWorker.terminate();
    }
    this.renderWorker = new WorldRenderWorker();
    singleWorker = this.renderWorker;
    this.renderWorker.onmessage = (ev: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(ev.data);
    };
    const offscreenCanvas = canvas.transferControlToOffscreen();
    // const message: RenderModel = {
    //   ...toRaw(props),
    //   canvas: offscreen,
    //   RenderService: undefined,
    // };
    this.renderWorker.postMessage({ model, offscreenCanvas }, [offscreenCanvas]);
  }
  update(model: RenderModel): void {
    this.renderWorker.postMessage({ model });
    // console.log('model', model)
    // console.log('s')
    // const message: RenderModel = {
    //   ...toRaw(props),
    //   RenderService: undefined,
    // };
    // this.renderWorker.postMessage(message);
  }
}

export interface WorldRenderSetup {
  model: WorldRenderModel;
  RenderService?: RenderServiceConstructor;
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
