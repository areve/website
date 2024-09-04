import { makeWorldGenerator } from "./world";
import { WorldGenerator } from "./world";
import { drawScene } from "./drawScene";
import { Camera, Dimensions } from "../lib/render";
import { toRaw } from "vue";

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
  canvas?: OffscreenCanvas;
}

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

class WorldGlRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private model!: RenderModel;
  private generator!: WorldGenerator;
  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.gl = canvas.getContext("webgl2")!;
    this.generator = makeWorldGenerator(model.seed);
    // this.update(model);
  };
  update(model: RenderModel): void {
    this.model = toRaw(model); //JSON.parse(JSON.stringify());
    console.log("update", this.model.frame);
    const start = self.performance.now();
    drawScene(this.gl, this.model.frame, this.generator);
    const end = self.performance.now();

    // setTimeout(() => {
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
    // }, 0);
  }
}

const singletonWorldGlRenderService = new WorldGlRenderService();

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
      return singletonWorldGlRenderService;
    },
  };
};
