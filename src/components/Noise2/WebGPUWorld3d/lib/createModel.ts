import { vec3 } from "wgpu-matrix";
import { createModelBuffer } from "./buffer";
import { applyCamera, Camera } from "./camera";

export function createModel(
  device: GPUDevice,
  geometry: {
    vertexArray: Float32Array;
    label: string;
    vertexSize: number;
    positionOffset: number;
    uvOffset: number;
    vertexCount: number;
  }
) {
  const buffer = createModelBuffer(device, geometry);

  const layout: GPUVertexBufferLayout = {
    arrayStride: geometry.vertexSize,
    attributes: [
      {
        // position
        shaderLocation: 0,
        offset: geometry.positionOffset,
        format: "float32x4",
      },
      {
        // uv
        shaderLocation: 1,
        offset: geometry.uvOffset,
        format: "float32x2",
      },
    ],
  };

  return {
    buffer,
    layout,
    translation: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    geometry,
    matrix(camera: Camera) {
      return applyCamera(this.translation, this.rotation, camera);
    },
  };
}
