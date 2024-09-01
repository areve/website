import { toRaw } from "vue";
import { Dimensions, Camera } from "../lib/render";
import WorldRenderWorker from "./WorldRenderWorker?worker";
import { FrameUpdated } from "./WorldRenderWorker";

export interface RenderProps {
  title: string;
  seed: number;
  frame: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  canvas?: OffscreenCanvas;
  renderService?: {
    new (canvas: HTMLCanvasElement, props: RenderProps): RenderService;
  };
}

export interface RenderService {
  update(renderProps: RenderProps): void;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;
}

export type WorldRenderProps = RenderProps;

let singleWorker: Worker;
export class WorldRender implements RenderService {
  private renderWorker: Worker;
  frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(canvas: HTMLCanvasElement, props: RenderProps) {
    if (singleWorker) {
      console.log("Debug: terminate hit");
      singleWorker.terminate();
    }
    this.renderWorker = new WorldRenderWorker();
    singleWorker = this.renderWorker;
    this.renderWorker.onmessage = (ev: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(ev.data);
    };
    const offscreen = canvas.transferControlToOffscreen();
    const message: Partial<RenderProps> = {
      ...toRaw(props),
      canvas: offscreen,
      renderService: undefined,
    };
    this.renderWorker.postMessage(message, [offscreen]);
  }
  update(props: Partial<RenderProps>): void {
    const message: Partial<RenderProps> = {
      ...toRaw(props),
      renderService: undefined,
    };
    this.renderWorker.postMessage(message);
  }
}

export const makeWorld = (seed: number): WorldRenderProps => {
  const world: WorldRenderProps = {
    dimensions: { width: 500, height: 200 },
    selected: false,
    title: "World",
    camera: { x: 0, y: 0, zoom: 1 },
    seed,
    frame: 0,
    renderService: WorldRender,
  };
  return world;
};
