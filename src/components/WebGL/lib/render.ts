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

export interface ProgramInfo {
  program: WebGLProgram;
}

class GlRenderService implements RenderService {
  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private model!: RenderModel;
  private programInfo!: ProgramInfo;

  frameUpdated?: ((frameUpdated: FrameUpdated) => void) | undefined;
  init = (canvas: HTMLCanvasElement, model: RenderModel) => {
    this.gl = canvas.getContext("webgl2")!;
    this.programInfo = setupProgram(this.gl, this.model);

    this.update(model);
  };
  update(model: RenderModel): void {
    this.model = toRaw(model);

    const start = self.performance.now();

    render(this.gl, this.programInfo, this.model);

    const end = self.performance.now();
    if (!this.frameUpdated) return;
    this.frameUpdated({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    });
  }
}

const singletonGlRenderService = new GlRenderService();

export const makeWorld = (seed: number): RenderSetup => {
  return {
    model: {
      title: "Foo",
      seed,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: false,
      paused: false,
    },
    renderService: () => {
      return singletonGlRenderService;
    },
  };
};

function render(
  gl: WebGL2RenderingContext,
  programInfo: ProgramInfo,
  model: RenderModel
) {
  gl.clearColor(0.7, 0.3, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setupProgram(
  gl: WebGL2RenderingContext,
  model: RenderModel
): ProgramInfo {
  const program = gl.createProgram()!;
  gl.linkProgram(program);
  return {
    program,
  };
}
