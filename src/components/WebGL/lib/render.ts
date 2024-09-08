import { toRaw } from "vue";

export const glsl = (x: TemplateStringsArray) => x[0];

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
export type Canvas = HTMLCanvasElement | OffscreenCanvas;

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

export type RenderMethod = (model: RenderModel, diffTime: number) => void;
export type RenderSetupMethod = (
  canvas: Canvas,
  model: RenderModel
) => Promise<RenderMethod>;
export class CanvasRenderService implements RenderService {
  private canvas!: Canvas;
  private model!: RenderModel;
  private render!: RenderMethod;
  private setup: RenderSetupMethod;
  previousTime!: number;
  constructor(setup: RenderSetupMethod) {
    this.setup = setup;
  }

  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = async (canvas: Canvas, model: RenderModel) => {
    this.model = toRaw(model);
    this.canvas = canvas;
    this.previousTime = self.performance.now();
    this.render = await this.setup(this.canvas, this.model);
    this.update(model);
  };
  async update(model: RenderModel): Promise<void> {
    this.model = toRaw(model);

    const start = self.performance.now();
    await this.render(this.model, this.previousTime - start);

    this.previousTime = start;
    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
  }
}

export function makeRenderSetup(
  title: string,
  width: number,
  height: number,
  canvasRenderService: CanvasRenderService
): RenderSetup {
  return {
    model: {
      title,
      seed: 0,
      frame: 0,
      dimensions: { width, height },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: true,
      paused: false,
    },
    renderService: () => canvasRenderService,
  };
}
