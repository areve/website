import { mat4, vec3 } from "wgpu-matrix";

export type Camera = {
  viewMatrix: Float32Array;
  projectionMatrix: Float32Array;
};

export function createCamera(width: number, height: number): Camera {
  const projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 8,
    width / height,
    1,
    100.0
  );
  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));
  return { viewMatrix, projectionMatrix };
}

export function applyCamera(
  translation: Float32Array, // vec3
  rotation: Float32Array, // vec3
  camera: Camera
) {
  const result = mat4.create();
  mat4.translation(translation, result);
  mat4.rotate(result, rotation, 1, result);
  mat4.multiply(camera.viewMatrix, result, result);
  mat4.multiply(camera.projectionMatrix, result, result);
  return result;
}
