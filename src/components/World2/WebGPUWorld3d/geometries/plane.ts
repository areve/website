import { Geometry } from "../lib/webgpu";

export function createPlaneGeometry(
  label: string,
  width = 1.0,
  height = 1.0,
  widthSegments = 4,
  heightSegments = 4
): Geometry {
  const xStep = width / widthSegments;
  const yStep = height / heightSegments;

  const vertices: number[][] = [];
  const uvs: number[][] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const yPos = y * yStep;
    for (let x = 0; x <= widthSegments; x++) {
      const xPos = x * xStep;
      vertices.push([xPos, yPos, 0, 1]);
      uvs.push([x / widthSegments, y / heightSegments]);
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

  const vertexArray = new Float32Array(
    vertices.flatMap((pos, i) => [...pos, ...uvs[i]])
  );

  const float32size = 4;
  const componentsPerVertex = 6; // 4 for position, 2 for UV
  return {
    vertexArray,
    indexArray: new Uint32Array(indices),
    vertexCount: indices.length,
    // vertexSize: float32size * componentsPerVertex,
    // positionOffset: 0,
    // uvOffset: float32size * 4,
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
