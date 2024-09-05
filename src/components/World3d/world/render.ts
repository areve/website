import { makeWorldGenerator, pixel, WorldPoint } from "./world";
import { WorldGenerator } from "./world";
import { drawScene } from "./drawScene";
import { ProgramInfo, setupProgram } from "./program";
import { Camera, Dimensions } from "../lib/render";
import { toRaw } from "vue";
import { createLandscapeModel } from "./landscapeModel";
import {
  createPositionsBuffer,
  createIndicesBuffer,
  createColorsBuffer,
  createNormalsBuffer,
} from "./buffers";
import { Rgb } from "../lib/color";

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

function render(
  gl: WebGL2RenderingContext,
  programInfo: ProgramInfo,
  model: RenderModel,
  generator: WorldGenerator,
  pixel: (point: WorldPoint) => Rgb
) {
  const width = 100;
  const height = 100;
  const landscapeModel = createLandscapeModel(
    width,
    height,
    model,
    generator,
    pixel
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
  private pixel!: (point: WorldPoint) => Rgb;
  private programInfo!: ProgramInfo;
  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.gl = canvas.getContext("webgl2")!;
    this.generator = makeWorldGenerator(model.seed);
    this.pixel = pixel;
    this.programInfo = setupProgram(this.gl);
    this.update(model)
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);
    const start = self.performance.now();

    render(this.gl, this.programInfo, this.model, this.generator, this.pixel);

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
      paused: true,
    },
    renderService: () => {
      return singletonWorldGlRenderService;
    },
  };
};
