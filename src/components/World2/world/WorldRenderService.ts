import { toRaw } from "vue";
import { Dimensions, Camera } from "../lib/render";
import WorldRenderWorker from "./WorldRenderWorker?worker";

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
}

export type WorldRenderProps = RenderProps;

export class WorldRenderService implements RenderService {
  private renderWorker = new WorldRenderWorker();

  constructor(canvas: HTMLCanvasElement, props: RenderProps) {
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
    renderService: WorldRenderService,
  };
  return world;
};
