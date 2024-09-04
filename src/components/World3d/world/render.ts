import { WorldGenerator } from "./world";
import { drawScene } from "./drawScene";
import { Camera, Dimensions } from "../lib/render";

let cubeRotation = 7.8;
let deltaTime = 0;
let then = 0;

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

export function renderWorld(gl: WebGLRenderingContext, generator: WorldGenerator) {

  let now = self.performance.now() / 1000;
  deltaTime = now - then;
  then = now;

  drawScene(gl, cubeRotation, generator);
  cubeRotation += deltaTime;
}
