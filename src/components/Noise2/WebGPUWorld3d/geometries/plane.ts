import { Geometry } from "../lib/webgpu";

export function createPlaneGeometry(
  label: string,
  width = 1.0,
  height = 1.0,
  widthSegments = 4,
  heightSegments = 4
): Geometry & { faceCoord: number } {
  const xStep = width / widthSegments;
  const yStep = height / heightSegments;

  const uv00 = [0, 0];
  const uv10 = [xStep, 0];
  const uv01 = [0, yStep];
  const uv11 = [xStep, yStep];

  let i = 0;
  const vertices: number[][][] = [];
  for (let y = 0; y < heightSegments; y++) {
    const yPos1 = y * yStep;
    const yPos2 = (1 + y) * yStep;
    const faceY = y * yStep;

    for (let x = 0; x < widthSegments; x++) {
      const xPos1 = x * xStep;
      const xPos2 = (1 + x) * xStep;
      const face = [x * xStep, faceY];

      vertices.push([
        [xPos1, yPos1, 0, 1, ...uv00, ...face],
        [xPos2, yPos1, 0, 1, ...uv10, ...face],
        [xPos2, yPos2, 0, 1, ...uv11, ...face],
      ]);

      vertices.push([
        [xPos2, yPos2, 0, 1, ...uv11, ...face],
        [xPos1, yPos2, 0, 1, ...uv01, ...face],
        [xPos1, yPos1, 0, 1, ...uv00, ...face],
      ]);
    }
  }

  const componentsPerVertex = 8;
  const float32size = 4;
  return {
    vertexArray: new Float32Array(vertices.flat().flat()),
    vertexCount: widthSegments * heightSegments * 6,
    vertexSize: float32size * componentsPerVertex,
    positionOffset: 0,
    uvOffset: float32size * 4,
    faceCoord: float32size * 6,
    label,
  };
}
