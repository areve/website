import { Geometry } from "../lib/webgpu";

export const createPlaneGeometry = createIndexedPlaneGeometry;

export function createVertexPlaneGeometry(
  label: string,
  width = 1.0,
  height = 1.0,
  widthSegments = 4,
  heightSegments = 4
): Geometry & { faceCoordOffset: number } {
  const xStep = width / widthSegments;
  const yStep = height / heightSegments;

  const uv00 = [0, 0];
  const uv10 = [xStep, 0];
  const uv01 = [0, yStep];
  const uv11 = [xStep, yStep];

  const vertices: number[][][] = [];
  const indices: number[] = [];

  let vertexIndex = 0;
  for (let y = 0; y < heightSegments; y++) {
    const y1 = y * yStep;
    const y2 = (1 + y) * yStep;

    for (let x = 0; x < widthSegments; x++) {
      const x1 = x * xStep;
      const x2 = (1 + x) * xStep;
      const face = [x1, y1];

      vertices.push([
        [x1, y1, 0, 1, ...uv00, ...face],
        [x2, y1, 0, 1, ...uv10, ...face],
        [x2, y2, 0, 1, ...uv11, ...face],
      ]);

      vertices.push([
        [x2, y2, 0, 1, ...uv11, ...face],
        [x1, y2, 0, 1, ...uv01, ...face],
        [x1, y1, 0, 1, ...uv00, ...face],
      ]);

      indices.push(
        vertexIndex,
        vertexIndex + 1,
        vertexIndex + 2, // First triangle
        vertexIndex + 3,
        vertexIndex + 4,
        vertexIndex + 5 // Second triangle
      );

      vertexIndex += 6; // Each quad contributes 6 vertices
    }
  }

  const componentsPerVertex = 8;
  const float32size = 4;
  return {
    vertexArray: new Float32Array(vertices.flat().flat()),
    indexArray: new Uint32Array(indices),
    vertexCount: widthSegments * heightSegments * 6,
    vertexSize: float32size * componentsPerVertex,
    positionOffset: 0,
    uvOffset: float32size * 4,
    faceCoordOffset: float32size * 6,
    label,
  };
}

export function createIndexedPlaneGeometry(
  label: string,
  width = 1.0,
  height = 1.0,
  widthSegments = 4,
  heightSegments = 4
): Geometry & { faceCoordOffset: number } {
  const xStep = width / widthSegments;
  const yStep = height / heightSegments;

  const vertices: number[][] = [];
  const uvs: number[][] = [];
  const indices: number[] = [];
  let faceCoords: number[][] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const yPos = y * yStep;
    for (let x = 0; x <= widthSegments; x++) {
      const xPos = x * xStep;
      vertices.push([xPos, yPos, 0, 1]);
      uvs.push([x / widthSegments, y / heightSegments]);
      faceCoords.push([xPos, yPos]);
    }
  }

  // Generate indices for each quad (two triangles per quad)
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const topLeft = y * (widthSegments + 1) + x;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + (widthSegments + 1);
      const bottomRight = bottomLeft + 1;

      // Triangle 1
      indices.push(topLeft, bottomRight, bottomLeft);
      // Triangle 2
      indices.push(topLeft, topRight, bottomRight);
    }
  }

  const flatVertices = vertices.flat();
  const flatUvs = uvs.flat();
  const flatFaceCoords = faceCoords.flat();

  const float32size = 4;
  const componentsPerVertex = 8; // 4 for position, 2 for UV, 2 for faceCoords
  const vertexArray = new Float32Array(flatVertices.length * 2); // Position + UV + faceCoords
  let vertexIndex = 0;

  for (let i = 0; i < vertices.length; i++) {
    const pos = vertices[i];
    const uv = uvs[i];
    const face = faceCoords[i];

    vertexArray[vertexIndex++] = pos[0];
    vertexArray[vertexIndex++] = pos[1];
    vertexArray[vertexIndex++] = pos[2];
    vertexArray[vertexIndex++] = pos[3];
    vertexArray[vertexIndex++] = uv[0];
    vertexArray[vertexIndex++] = uv[1];
    vertexArray[vertexIndex++] = face[0];
    vertexArray[vertexIndex++] = face[1];
  }

  return {
    vertexArray,
    indexArray: new Uint32Array(indices), // Returning the index buffer
    vertexCount: indices.length, // Number of indices
    vertexSize: float32size * componentsPerVertex,
    positionOffset: 0,
    uvOffset: float32size * 4,
    faceCoordOffset: float32size * 6,
    label,
  };
}
