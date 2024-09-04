import { mat4 } from "gl-matrix";
import { Buffers } from "./buffers";
import { ProgramInfo } from "./program";

export function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  buffers: Buffers,
  cubeRotation: number
) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.0, 0.5, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  setPositionAttribute(gl, buffers, programInfo.attribLocations.vertexPosition);
  setColorAttribute(gl, buffers, programInfo.attribLocations.vertexColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.useProgram(programInfo.program);

  createProjectionMatrix(gl, programInfo.uniformLocations.projectionMatrix);

  createModelViewMatrix(
    gl,
    cubeRotation,
    programInfo.uniformLocations.modelViewMatrix
  );

  draw(gl);
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

function draw(gl: WebGLRenderingContext) {
  const vertexCount = 36;
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}

function createProjectionMatrix(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation
) {
  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
  const matrix = mat4.create();

  mat4.perspective(matrix, fieldOfView, aspect, zNear, zFar);
  gl.uniformMatrix4fv(location, false, matrix);
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(
  gl: WebGLRenderingContext,
  buffers: Buffers,
  vertexPosition: GLint
) {
  const numComponents = 3;
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
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

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(
  gl: WebGLRenderingContext,
  buffers: Buffers,
  vertexColor: GLint
) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
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
