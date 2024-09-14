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

  const vertices: number[][][] = [];
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
