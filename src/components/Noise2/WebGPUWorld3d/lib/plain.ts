// export const plainVertexSize = 4 * 10; // Byte size of one plain vertex.
// export const plainPositionOffset = 0;
// export const plainColorOffset = 4 * 4; // Byte offset of plain vertex color attribute.
// export const plainUVOffset = 4 * 8;
// export const plainVertexCount = 36;

export function createPlain() {
  let foo = [];
  let Y = 9;
  let X = 9;

  // prettier-ignore
  for (var y = 0; y < Y; y++) {
    for (var x = 0; x < X; x++) {
      let v = 0.5;
      let a = -1 / v / 2;
      let b = 1 / v / 2;
      foo.push([a + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    1, 1]);
      foo.push([b + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    0, 1]);
      foo.push([b + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    0, 0]);

      foo.push([b + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    0, 0]);
      foo.push([a + x / v, b + y / v, 0, 1,   1, 0, 1, 1,    1, 0]);
      foo.push([a + x / v, a + y / v, 0, 1,   1, 0, 1, 1,    1, 1]);
    }
  }

  const vertexArray = new Float32Array(foo.flat());
  return {
    vertexArray,
    vertexCount: X * Y * 6,
  };
}
