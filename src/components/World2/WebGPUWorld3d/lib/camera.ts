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

  const translation = vec3.fromValues(0, 1, -16);
  const rotation = vec3.fromValues(-Math.PI / 5, 0, 0);
  
  let viewMatrix = mat4.create();
  mat4.translation(translation, viewMatrix);
  mat4.rotateX(viewMatrix, rotation[0], viewMatrix);
  mat4.rotateY(viewMatrix, rotation[1], viewMatrix);
  mat4.rotateZ(viewMatrix, rotation[2], viewMatrix);
  return { viewMatrix, projectionMatrix };
}

export function applyCamera(
  translation: Float32Array, // vec3
  rotation: Float32Array, // vec3
  camera: Camera
) {
  const result = mat4.create();
  mat4.translation(translation, result);
  mat4.rotateX(result, rotation[0], result);
  mat4.rotateY(result, rotation[1], result);
  mat4.rotateZ(result, rotation[2], result);
  mat4.multiply(camera.viewMatrix, result, result);
  mat4.multiply(camera.projectionMatrix, result, result);
  return result;
}
