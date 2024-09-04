import { mat4 } from "gl-matrix";
import { createColors, createIndices, createPositions } from "./buffers";
import { setupProgramInfo as setupProgram } from "./program";

export function drawScene(gl: WebGLRenderingContext, cubeRotation: number) {
  const { program, locations } = setupProgram(gl);
  const positions = createPositions(gl);
  const indices = createIndices(gl);
  const colors = createColors(gl);

  clear(gl);
  setupVertexPositions(gl, positions.buffer, locations.vertexPosition);
  setupColors(gl, colors.buffer, locations.vertexColor);
  setupIndices(gl, indices.buffer);

  gl.useProgram(program);
  createProjectionMatrix(gl, locations.projectionMatrix);
  createModelViewMatrix(gl, cubeRotation, locations.modelViewMatrix);

  draw(gl, indices.vertexCount);
}

function clear(gl: WebGLRenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.0, 0.5, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setupVertexPositions(
  gl: WebGLRenderingContext,
  position: WebGLBuffer,
  vertexPosition: GLint
) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
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

function setupColors(
  gl: WebGLRenderingContext,
  color: WebGLBuffer,
  vertexColor: GLint
) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, color);
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

function setupIndices(gl: WebGLRenderingContext, indices: WebGLBuffer) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
}

function createProjectionMatrix(
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

function createModelViewMatrix(
  gl: WebGLRenderingContext,
  cubeRotation: number,
  location: WebGLUniformLocation
) {
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [-0.0, 0.0, -6.0]);
  mat4.rotate(matrix, matrix, cubeRotation, [0, 0, 1]);
  mat4.rotate(matrix, matrix, cubeRotation * 0.7, [0, 1, 0]);
  mat4.rotate(matrix, matrix, cubeRotation * 0.3, [1, 0, 0]);
  gl.uniformMatrix4fv(location, false, matrix);
}

function draw(gl: WebGLRenderingContext, vertexCount: number) {
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}
