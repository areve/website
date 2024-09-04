import { WorldGenerator } from "./world";

export interface Model {
  width: number;
  height: number;
  positions: number[];
  colors: number[];
  indices: number[];
  normals: number[];
}

export function createLandscapeModel(
  width: number,
  height: number,
  frame: number,
  generator: WorldGenerator
): Model {
  let vertices1: number[][] = [];
  let indices1: number[][] = [];
  let colors1: number[][] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const worldPoint = generator(x, y, frame);
      // console.log(foo);
      // TODO random colors for now
      if (worldPoint.isSea) {
        const vertex = [x, y, 0.6 * 40]; //- worldPoint.height];
        vertices1.push(vertex);
        colors1.push([0.5, 0.6, 1.0, 1]);
      } else {
        const vertex = [x, y, worldPoint.height * 40];
        vertices1.push(vertex);
        colors1.push([0.4, 0.6, 0, 1]);
      }
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

  return {
    positions: vertices,
    colors,
    indices,
    normals,
    width,
    height,
  };
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