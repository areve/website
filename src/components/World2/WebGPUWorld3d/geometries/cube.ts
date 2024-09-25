import { Geometry } from "../lib/webgpu";

export function createCubeGeometry(label: string): Geometry {
  // prettier-ignore
  const vertexArray = new Float32Array([
    // float4 position, float2 uv
    1, -1, 1, 1,     0, 1,
    -1, -1, 1, 1,    1, 1,
    -1, -1, -1, 1,   1, 0,
    1, -1, -1, 1,    0, 0,
    1, -1, 1, 1,     0, 1,
    -1, -1, -1, 1,   1, 0,

    1, 1, 1, 1,      0, 1,
    1, -1, 1, 1,     1, 1,
    1, -1, -1, 1,    1, 0,
    1, 1, -1, 1,     0, 0,
    1, 1, 1, 1,      0, 1,
    1, -1, -1, 1,    1, 0,

    -1, 1, 1, 1,     0, 1,
    1, 1, 1, 1,      1, 1,
    1, 1, -1, 1,     1, 0,
    -1, 1, -1, 1,    0, 0,
    -1, 1, 1, 1,     0, 1,
    1, 1, -1, 1,     1, 0,

    -1, -1, 1, 1,    0, 1,
    -1, 1, 1, 1,     1, 1,
    -1, 1, -1, 1,    1, 0,
    -1, -1, -1, 1,   0, 0,
    -1, -1, 1, 1,    0, 1,
    -1, 1, -1, 1,    1, 0,

    1, 1, 1, 1,      0, 1,
    -1, 1, 1, 1,     1, 1,
    -1, -1, 1, 1,    1, 0,
    -1, -1, 1, 1,    1, 0,
    1, -1, 1, 1,     0, 0,
    1, 1, 1, 1,      0, 1,

    1, -1, -1, 1,    0, 1,
    -1, -1, -1, 1,   1, 1,
    -1, 1, -1, 1,    1, 0,
    1, 1, -1, 1,     0, 0,
    1, -1, -1, 1,    0, 1,
    -1, 1, -1, 1,    1, 0,
  ]);

  return {
    vertexArray,
    vertexCount: 36,
    label,
    layout: [
      {
        arrayStride: 4 * 6,
        attributes: [
          {
            // label: "position",
            shaderLocation: 0,
            offset: 0,
            format: "float32x4",
          },
          {
            // label: "uv",
            shaderLocation: 1,
            offset: 4 * 4,
            format: "float32x2",
          },
        ],
      },
    ],
  };
}
