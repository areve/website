import { mat4 } from "gl-matrix";
import {
  createColors,
  createIndices,
  createNormals,
  setupPositions,
} from "./buffers";
import { ProgramInfo } from "./program";
import { Model } from "./createSceneModel";

const vtl = -40;
export function drawScene(
  gl: WebGLRenderingContext,
  program: ProgramInfo,
  sceneModel: Model
) {
  setupPositions(gl, sceneModel.vertices, program.vertexPosition);
  createColors(gl, sceneModel.colors, program.vertexColor);
  createNormals(gl, sceneModel.normals, program.vertexNormal);

  const indices = createIndices(gl, sceneModel.indices);
  gl.useProgram(program.instance);

  setupClean(gl);

  const modelViewMatrix = applyModelViewMatrix2(
    gl,
    program.modelViewMatrix,
    sceneModel.width,
    sceneModel.height
  );
  applyProjectionMatrix2(gl, program.projectionMatrix);
  doNormalMatrix(gl, modelViewMatrix, program.normalMatrix);
  draw(gl, indices.vertexCount);
}

function setupClean(gl: WebGLRenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  // gl.clearColor(0.0, 0.5, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function applyProjectionMatrix(
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
  // gl.flush();
  // gl.drawArrays(gl.LINE_STRIP, 0, vertexCount/3);
  // gl.drawArrays(gl.LINE_LOOP, 0, vertexCount);
}
