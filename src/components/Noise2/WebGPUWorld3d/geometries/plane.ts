import { Geometry } from "../lib/webgpu";

export function createPlaneGeometry(label: string): Geometry & {
  faceCoord: number;
} {
  let data = [];
  let width = 10.0;
  let height = 10.0;
  let gridWidth = 50;
  let gridHeight = 50;
  let ax = -0.5;
  let bx = 0.5;
  let ay = -0.5;
  let by = 0.5;
  let xStep = width / gridWidth;
  let yStep = height / gridHeight;
  // prettier-ignore
  for (var y = 0; y < gridHeight; y++) {
    for (var x = 0; x < gridWidth; x++) {
      
      
      data.push([(ax + x) * xStep, (ay + y) * yStep, 0, 1,    0*xStep, 0*yStep,   x*xStep, y*yStep]);
      data.push([(bx + x) * xStep, (ay + y) * yStep, 0, 1,    1*xStep, 0*yStep,   x*xStep, y*yStep]);
      data.push([(bx + x) * xStep, (by + y) * yStep, 0, 1,    1*xStep, 1*yStep,   x*xStep, y*yStep]);

      data.push([(bx + x) * xStep, (by + y) * yStep, 0, 1,    1*xStep, 1*yStep,   x*xStep, y*yStep]);
      data.push([(ax + x) * xStep, (by + y) * yStep, 0, 1,    0*xStep, 1*yStep,   x*xStep, y*yStep]);
      data.push([(ax + x) * xStep, (ay + y) * yStep, 0, 1,    0*xStep, 0*yStep,   x*xStep, y*yStep]);
    }
  }

  const vertexArray = new Float32Array(data.flat());
  return {
    vertexArray,
    vertexCount: gridWidth * gridHeight * 6,
    vertexSize: 4 * 8, // Byte size of one cube vertex.
    positionOffset: 0,
    uvOffset: 4 * 4,
    faceCoord: 6 * 4,
    label,
  };
}
