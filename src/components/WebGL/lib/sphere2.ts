import { RenderModel, RenderSetup, CanvasRenderService } from "./render";
let singleton: CanvasRenderService;

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
    renderService: () => (singleton ??= new CanvasRenderService(setup)),
  };
};

function setup(canvas: HTMLCanvasElement, model: RenderModel) {
  const gl = canvas.getContext("webgl2")!;
  const program = gl.createProgram()!;
  gl.linkProgram(program);

  return function render(model: RenderModel) {
    gl.clearColor(0.3, 0.7, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };
}
