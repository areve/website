import { mat4 } from "gl-matrix";
import { ProgramInfo } from "./program";
import { Model } from "./landscapeModel";

const vtl = -40;
export function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  buffers: {
    positions: WebGLBuffer;
    colors: WebGLBuffer;
    normals: WebGLBuffer;
  },
  landscapeModel: Model
) {
  initialize(gl);
  
  gl.useProgram(programInfo.program);
  setPositionsAttribute(gl, buffers.positions, programInfo.vertexPosition);
  setColorsAttribute(gl, buffers.colors, programInfo.vertexColor);
  setNormalsAttribute(gl, buffers.normals, programInfo.vertexNormal);

  const modelViewMatrix = createModelViewMatrix(landscapeModel.width);
  const projectionMatrix = createProjectionMatrix(gl);
  const normalMatrix = createNormalMatrix(gl, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.normalMatrix, false, normalMatrix);

  draw(gl, landscapeModel.indices.length);
}

function initialize(gl: WebGLRenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.4, 0.8, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setPositionsAttribute(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  vertexPosition: GLint
) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(vertexPosition);
}

function setColorsAttribute(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  vertexColor: GLint
) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(vertexColor);
}

function setNormalsAttribute(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  vertexNormal: GLint
) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    vertexNormal,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(vertexNormal);
}

function createProjectionMatrix(gl: WebGLRenderingContext) {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
  const matrix = mat4.create();
  mat4.perspective(matrix, fieldOfView, aspect, zNear, zFar);
  return matrix;
}

function createModelViewMatrix(width: number) {
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [-width / 2, vtl, -50]);
  mat4.rotate(matrix, matrix, -0.25 * Math.PI, [1, 0, 0]);
  return matrix;
}

function createNormalMatrix(gl: WebGLRenderingContext, modelViewMatrix: mat4) {
  const matrix = mat4.create();
  mat4.invert(matrix, modelViewMatrix);
  mat4.transpose(matrix, matrix);
  return matrix;
}

function draw(gl: WebGLRenderingContext, vertexCount: number) {
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}
