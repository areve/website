import { Dimensions, Camera } from "../lib/render";
import WorldRenderWorker from "./WorldRenderWorker?worker";
import { FrameUpdated } from "./WorldRenderWorker";
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

let singleWorker: Worker;

export class WorldRender implements RenderService {
  private renderWorker: Worker;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(canvas: HTMLCanvasElement, model: RenderModel) {
    if (singleWorker) {
      console.log("Debug: terminate hit");
      singleWorker.terminate();
    }
    const memory = new WebAssembly.Memory({
      initial: 10,
      maximum: 10,
      shared: true,
    });

    // const uint8 = new Uint8Array(memory.buffer);
    // uint8[0] = 123;
    // uint8[1] = 1;
    // uint8[2] = 2;
    // uint8[3] = 3;

    // console.log("shared memory", uint8.slice(0, 6));
    // memory

    // const worker = new Worker("./WorldRenderWorker");

    const buffer = new ArrayBuffer(16);
    // const sab = new SharedArrayBuffer(16); // not defined

    // const foo = ;
    this.renderWorker = new Worker(
      new URL('./WorldRenderWorker', import.meta.url),
      {type: 'module'}
    );
    // this.renderWorker.
    singleWorker = this.renderWorker;
    this.renderWorker.onmessage = (ev: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(ev.data);
    };
    const offscreenCanvas = canvas.transferControlToOffscreen();
    this.renderWorker.postMessage(
      { model: toRaw(model), offscreenCanvas },
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
