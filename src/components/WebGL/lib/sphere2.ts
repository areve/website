import {
  GlRenderService,
  ProgramInfo,
  RenderModel,
  RenderSetup,
} from "./render";
let singletonGlRenderService: GlRenderService;

export const makeSphere2RenderSetup = (): RenderSetup => {
  return {
    model: {
      title: "Sphere 2",
      seed: 0,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: false,
      paused: false,
    },
    renderService: () =>
      (singletonGlRenderService ??= new GlRenderService(
        render,
        setupProgram
      )),
  };
};

function render(
  gl: WebGL2RenderingContext,
  programInfo: ProgramInfo,
  model: RenderModel
) {
  gl.clearColor(0.3, 0.7, 0.0, 1.0);
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
