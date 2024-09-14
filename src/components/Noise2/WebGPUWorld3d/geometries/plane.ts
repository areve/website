import { Geometry } from "../lib/webgpu";

export function createPlaneGeometry(label: string): Geometry {
  let data = [];
  let Y = 9;
  let X = 4;

  // prettier-ignore
  for (var y = 0; y < Y; y++) {
    for (var x = 0; x < X; x++) {
      let v = 0.5;
      let a = -1 / v / 2;
      let b = 1 / v / 2;

      data.push([a + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    1, 1]);
      data.push([b + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    0, 1]);
      data.push([b + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    0, 0]);

      data.push([b + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    0, 0]);
      data.push([a + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    1, 0]);
      data.push([a + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    1, 1]);
    }
  }

  const vertexArray = new Float32Array(data.flat());
  return {
    vertexArray,
    vertexCount: X * Y * 6,
    vertexSize: 4 * 10, // Byte size of one cube vertex.
    positionOffset: 0,
    uvOffset: 4 * 8,
    label,
  };
}
