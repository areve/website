import { mat4 } from "gl-matrix";
import { ProgramInfo } from "./program";
import { Model } from "./landscapeModel";

const vtl = -40;
export function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  landscapeModel: Model
) {
  initialize(gl);

  const modelViewMatrix = applyModelViewMatrix2(
    gl,
    programInfo.modelViewMatrix,
    landscapeModel.width,
    landscapeModel.height
  );
  
  applyProjectionMatrix2(gl, programInfo.projectionMatrix);
  doNormalMatrix(gl, modelViewMatrix, programInfo.normalMatrix);

  const vertexCount = landscapeModel.indices.length;
  draw(gl, vertexCount);
}

function initialize(gl: WebGLRenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.4, 0.8, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function applyProjectionMatrix2(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation
) {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
  const matrix = mat4.create();

  mat4.perspective(matrix, fieldOfView, aspect, zNear, zFar);
  gl.uniformMatrix4fv(location, false, matrix);
}

function applyModelViewMatrix2(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation,
  width: number,
  height: number
) {
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [-width / 2, vtl, -50]);
  mat4.rotate(matrix, matrix, -0.25 * Math.PI, [1, 0, 0]);

  gl.uniformMatrix4fv(location, false, matrix);
  return matrix;
}

function doNormalMatrix(
  gl: WebGLRenderingContext,
  modelViewMatrix: mat4,
  location: WebGLUniformLocation
) {
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.uniformMatrix4fv(location, false, normalMatrix);
}

function draw(gl: WebGLRenderingContext, vertexCount: number) {
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}
