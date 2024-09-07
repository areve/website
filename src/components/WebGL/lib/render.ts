import { toRaw } from "vue";

export interface Dimensions {
  width: number;
  height: number;
}
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderSetup {
  model: RenderModel;
  renderService: () => RenderService;
}
export interface RenderService {
  frameUpdated?: (frameUpdated: FrameUpdated) => void;
  init(canvas: HTMLCanvasElement, model: RenderModel): void;
  update(model: RenderModel): void;
}

export interface RenderModel {
  title: string;
  seed: number;
  frame: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  paused: boolean;
  canvas?: OffscreenCanvas;
}

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

export class CanvasRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private model!: RenderModel;
  private render!: (model: RenderModel) => void;
  private setup: (
    canvas: HTMLCanvasElement,
    model: RenderModel
  ) => (model: RenderModel) => void;
  constructor(
    setup: (canvas: HTMLCanvasElement, model: RenderModel) => (model: RenderModel) => void
  ) {
    this.setup = setup;
  }

  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.model = toRaw(model);
    this.canvas = canvas;
    this.render = this.setup(this.canvas, this.model);

    this.update(model);
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);

    const start = self.performance.now();

    this.render(this.model);

    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
  }
}
