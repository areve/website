import { WorldGenerator } from "../../world/world";
import { drawScene } from "./drawScene";

let cubeRotation = 7.8;
let deltaTime = 0;
let then = 0;

export function renderWorld(gl: WebGLRenderingContext, generator: WorldGenerator) {

  let now = self.performance.now() / 1000;
  deltaTime = now - then;
  then = now;

  drawScene(gl, cubeRotation, generator);
  cubeRotation += deltaTime;
}
