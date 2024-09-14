import { Geometry } from "../lib/webgpu";

export function createPlaneGeometry(label: string): Geometry & {
  faceCoord: number;
} {
  let data = [];
  let Y = 4;
  let X = 4;

  // prettier-ignore
  for (var y = 0; y < Y; y++) {
    for (var x = 0; x < X; x++) {
      let v = 0.5;
      let a = -1 / v / 2;
      let b = 1 / v / 2;

      data.push([a + x / v, a + y / v, 0, 1,    0, 0,   x, y]);
      data.push([b + x / v, a + y / v, 0, 1,    1, 0,   x, y]);
      data.push([b + x / v, b + y / v, 0, 1,    1, 1,   x, y]);

      data.push([b + x / v, b + y / v, 0, 1,    1, 1,   x, y]);
      data.push([a + x / v, b + y / v, 0, 1,    0, 1,   x, y]);
      data.push([a + x / v, a + y / v, 0, 1,    0, 0,   x, y]);
    }
  }

  const vertexArray = new Float32Array(data.flat());
  return {
    vertexArray,
    vertexCount: X * Y * 6,
    vertexSize: 4 * 8, // Byte size of one cube vertex.
    positionOffset: 0,
    uvOffset: 4 * 4,
    faceCoord: 6 * 4,
    label,
  };
}
