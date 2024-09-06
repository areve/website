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

export interface GlProgramInfo {
  program: WebGLProgram;
}

export class GlRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private model!: RenderModel;
  private programInfo!: GlProgramInfo;
  private render: (
    gl: WebGL2RenderingContext,
    programInfo: GlProgramInfo,
    model: RenderModel
  ) => void;
  private setupProgram: (
    gl: WebGL2RenderingContext,
    model: RenderModel
  ) => GlProgramInfo;
  constructor(
    render: (
      gl: WebGL2RenderingContext,
      programInfo: GlProgramInfo,
      model: RenderModel
    ) => void,
    setupProgram: (
      gl: WebGL2RenderingContext,
      model: RenderModel
    ) => GlProgramInfo
  ) {
    this.render = render;
    this.setupProgram = setupProgram;
  }
  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.gl = canvas.getContext("webgl2")!;
    this.programInfo = this.setupProgram(this.gl, this.model);

    this.update(model);
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);

    const start = self.performance.now();

    this.render(this.gl, this.programInfo, this.model);

    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
  }
}

export interface CanvasProgramInfo {}

export class CanvasRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private model!: RenderModel;
  private programInfo!: CanvasProgramInfo;
  private render: (programInfo: any, model: RenderModel) => void;
  private setupProgram: (
    canvas: HTMLCanvasElement,
    model: RenderModel
  ) => CanvasProgramInfo;
  constructor(
    render: (programInfo: CanvasProgramInfo, model: RenderModel) => void,
    setupProgram: (
      canvas: HTMLCanvasElement,
      model: RenderModel
    ) => CanvasProgramInfo
  ) {
    this.render = render;
    this.setupProgram = setupProgram;
  }
  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.canvas = canvas;
    this.programInfo = this.setupProgram(this.canvas, this.model);

    this.update(model);
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);

    const start = self.performance.now();

    this.render(this.programInfo, this.model);

    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
  }
}
