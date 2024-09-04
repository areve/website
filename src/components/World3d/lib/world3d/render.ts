import { Buffers, createBuffers } from "./buffers";
import { setupProgramInfo, ProgramInfo } from "./program";
import { drawScene } from "./drawScene";

let cubeRotation = 237.0;
let deltaTime = 0;

let then = 0;

export function renderWorld(gl: WebGLRenderingContext) {
  const programInfo: ProgramInfo = setupProgramInfo(gl);
  const buffers: Buffers = createBuffers(gl);

  let now = self.performance.now() / 1000;
  deltaTime = now - then;
  then = now;

  drawScene(gl, programInfo, buffers, cubeRotation);
  cubeRotation += deltaTime;
}