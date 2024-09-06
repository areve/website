import {
  GlRenderService,
  ProgramInfo,
  RenderModel,
  RenderSetup,
} from "./render";
let singletonGlRenderService: GlRenderService;

export const makeFooRenderSetup = (): RenderSetup => {
  return {
    model: {
      title: "Foo",
      seed: 0,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: false,
      paused: false,
    },
    renderService: () =>
      (singletonGlRenderService ??= new GlRenderService(
        fooRender,
        fooSetupProgram
      )),
  };
};

function fooRender(
  gl: WebGL2RenderingContext,
  programInfo: ProgramInfo,
  model: RenderModel
) {
  gl.clearColor(0.7, 0.3, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function fooSetupProgram(
  gl: WebGL2RenderingContext,
  model: RenderModel
): ProgramInfo {
  const program = gl.createProgram()!;
  gl.linkProgram(program);
  return {
    program,
  };
}
