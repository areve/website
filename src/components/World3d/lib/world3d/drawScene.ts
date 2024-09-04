import { mat4 } from "gl-matrix";
import {
  createColors,
  createIndices,
  createNormals,
  setupPositions,
} from "./buffers";
import { setupProgramInfo as createProgram } from "./program";
import { WorldGenerator } from "../../world/world";

const vtl = -40;
function getModel2(width: number, height: number, generator: WorldGenerator) {
  let vertices1: number[][] = [];
  let indices1: number[][] = [];
  let colors1: number[][] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // console.log('generator', generator);
      const worldPoint = generator(x, y, 0);
      // console.log(foo);
      const vertex = [x, y, worldPoint.height * 40];
      vertices1.push(vertex);

      // TODO random colors for now
      colors1.push([
        0.2 + 0.2 * Math.random(),
        0.4 + 0.2 * Math.random(),
        0,
        1,
      ]);
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
  const normals = calculateNormals(vertices, indices);

  return { vertices, colors, indices, normals };
}

function calculateNormals(vertices: number[], indices: number[]) {
  // TODO this code could be wrong, it's certainly messy
  const normals: number[] = new Array(vertices.length).fill(0);

  function crossProduct(v1: number[], v2: number[]): number[] {
    return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
  }

  function normalize(vector: number[]): number[] {
    const length = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
    return vector.map((v) => v / length);
  }

  // Process each triangle
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i] * 3;
    const i2 = indices[i + 1] * 3;
    const i3 = indices[i + 2] * 3;

    const p1 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
    const p2 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];
    const p3 = [vertices[i3], vertices[i3 + 1], vertices[i3 + 2]];

    const v1 = p2.map((v, idx) => v - p1[idx]);
    const v2 = p3.map((v, idx) => v - p1[idx]);

    const normal = crossProduct(v1, v2);
    const normalizedNormal = normalize(normal);

    // Add the normal to each vertex of the triangle
    for (let j = 0; j < 3; j++) {
      normals[i1 + j] += normalizedNormal[j];
      normals[i2 + j] += normalizedNormal[j];
      normals[i3 + j] += normalizedNormal[j];
    }
  }

  // Normalize the normals for each vertex
  for (let i = 0; i < normals.length; i += 3) {
    const normal = [normals[i], normals[i + 1], normals[i + 2]];
    const normalizedNormal = normalize(normal);
    normals[i] = normalizedNormal[0];
    normals[i + 1] = normalizedNormal[1];
    normals[i + 2] = normalizedNormal[2];
  }
  return normals;
}

export function drawScene(
  gl: WebGLRenderingContext,
  cubeRotation: number,
  generator: WorldGenerator
) {
  // const model = getModel();
  const width = 64;
  const height = 64;

  const model = getModel2(width, height, generator);
  const program = createProgram(gl);
  setupPositions(gl, model.vertices, program.vertexPosition);
  createColors(gl, model.colors, program.vertexColor);
  createNormals(gl, model.normals, program.vertexNormal);

  const indices = createIndices(gl, model.indices);
  gl.useProgram(program.instance);

  setupClean(gl);

  const modelViewMatrix = applyModelViewMatrix2(
    gl,
    program.modelViewMatrix,
    width,
    height
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
