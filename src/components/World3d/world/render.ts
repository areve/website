import { makeWorldGenerator } from "./world";
import { WorldGenerator } from "./world";
import { drawScene } from "./drawScene";
import { setupProgram } from "./program";
import { Camera, Dimensions } from "../lib/render";
import { toRaw } from "vue";
import { createLandscapeModel } from "./landscapeModel";
import {
  setPositionsAttribute,
  createPositionsBuffer,
  createIndicesBuffer,
  createColorsBuffer,
  createNormalsBuffer,
  setColorsAttribute,
  setNormalsAttribute,
} from "./buffers";

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

function render(
  gl: WebGL2RenderingContext,
  model: RenderModel,
  generator: WorldGenerator
) {
  const programInfo = setupProgram(gl);

  const width = 100;
  const height = 100;
  const landscapeModel = createLandscapeModel(
    width,
    height,
    model.frame,
    generator
  );

  const positions = createPositionsBuffer(gl, landscapeModel.positions);
  const colors = createColorsBuffer(gl, landscapeModel.colors);
  const normals = createNormalsBuffer(gl, landscapeModel.normals);
  createIndicesBuffer(gl, landscapeModel.indices);

  const buffers = { positions, colors, normals };
  drawScene(gl, programInfo, buffers, landscapeModel);
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
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);
    const start = self.performance.now();

    render(this.gl, this.model, this.generator);

    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
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
