
import { FrameUpdated, RenderModel, RenderService, RenderSetup, renderWorld } from "./render";
import { makeWorldGenerator } from "./world";

const generator = makeWorldGenerator(12345);

class WorldGlRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private model!: RenderModel;
  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.gl = canvas.getContext("webgl2")!;
    this.update(model)
  };
  update(model: RenderModel): void {
    this.model = model;
    renderWorld(this.gl, generator);
  }
}

const singletonWorldGlRenderService = new WorldGlRenderService()

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
