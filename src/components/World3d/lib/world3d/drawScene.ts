import { mat4 } from "gl-matrix";
import { createColors, createIndices, setupPositions } from "./buffers";
import { setupProgramInfo as createProgram } from "./program";

function getModel() {
  const frontFace = [
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  const backFace = [
    [-1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [1, -1, -1],
  ];
  const topFace = [
    [-1, 1, -1],
    [-1, 1, 1, 1],
    [1, 1],
    [1, 1, -1],
  ];
  const bottomFace = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, -1, 1],
    [-1, -1, 1],
  ];
  const rightFace = [
    [1, -1, -1],
    [1, 1, -1],
    [1, 1, 1],
    [1, -1, 1],
  ];
  const leftFace = [
    [-1, -1, -1],
    [-1, -1, 1],
    [-1, 1, 1],
    [-1, 1, -1],
  ];
  const vertices = [
    frontFace,
    backFace,
    topFace,
    bottomFace,
    rightFace,
    leftFace,
  ]
    .flat()
    .flat();

  const frontFaceColor = [1, 1, 1, 1];
  const backFaceColor = [1, 0, 0, 1];
  const topFaceColor = [0, 1, 0, 1];
  const bottomFaceColor = [0, 0, 1, 1];
  const rightFaceColor = [1, 1, 0, 1];
  const leftFaceColor = [1, 0, 1, 1];
  const colors = [
    frontFaceColor,
    backFaceColor,
    topFaceColor,
    bottomFaceColor,
    rightFaceColor,
    leftFaceColor,
  ]
    .map((c) => [c, c, c, c])
    .flat()
    .flat();

  const front = [
    [0, 1, 2],
    [0, 2, 3],
  ];
  const back = [
    [4, 5, 6],
    [4, 6, 7],
  ];
  const top = [
    [8, 9, 10],
    [8, 10, 11],
  ];
  const bottom = [
    [12, 13, 14],
    [12, 14, 15],
  ];
  const right = [
    [16, 17, 18],
    [16, 18, 19],
  ];
  const left = [
    [20, 21, 22],
    [20, 22, 23],
  ];
  const indices = [front, back, top, bottom, right, left].flat().flat();

  return { vertices, colors, indices };
}

function getModel2() {
  let vertices1: number[][] = [];
  let indices1: number[][] = [];
  let colors1: number[][] = [];
  const width = 8;
  const height = 8;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vertex = [x, y, Math.random()];
      vertices1.push(vertex);
      colors1.push([1 - Math.random(), Math.random(), 0, 1]);
    }
  }
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const tri1 = [
        y * width + x,
        (y + 1) * width + x,
        (y + 1) * width + (x + 1),
      ];
      const tri2 = [
        y * width + x,
        y * width + x + 1,
        (y + 1) * width + (x + 1),
      ];

      indices1.push(tri1);
      indices1.push(tri2);
    }
  }

  const vertices = vertices1.flat();
  const colors = colors1.flat();
  const indices = indices1.flat();

  return { vertices, colors, indices };
}

export function drawScene(gl: WebGLRenderingContext, cubeRotation: number) {
  // const model = getModel();
  const model = getModel2();
  const program = createProgram(gl);
  setupPositions(gl, model.vertices, program.vertexPosition);
  createColors(gl, model.colors, program.vertexColor);
  const indices = createIndices(gl, model.indices);
  gl.useProgram(program.instance);

  setupClean(gl);
  // applyModelViewMatrix(gl, cubeRotation, program.modelViewMatrix);
  applyModelViewMatrix2(gl, program.modelViewMatrix);
  applyProjectionMatrix2(gl, program.projectionMatrix);
  draw(gl, indices.vertexCount);
}

function setupClean(gl: WebGLRenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.0, 0.5, 1.0, 1.0);
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

function applyModelViewMatrix(
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

function applyModelViewMatrix2(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation
) {
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [-3.0, -3.0, -10.0]);
  mat4.rotate(matrix, matrix, -0.25 * Math.PI, [1, 0, 0]);

  gl.uniformMatrix4fv(location, false, matrix);
}

function draw(gl: WebGLRenderingContext, vertexCount: number) {
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  // gl.flush();
  // gl.drawArrays(gl.LINE_STRIP, 0, vertexCount/3);
  // gl.drawArrays(gl.LINE_LOOP, 0, vertexCount);
}
