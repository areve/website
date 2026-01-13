interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

export function createPerspectiveMatrix(
  fov: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  const result = new Float32Array(16);
  result[0] = f / aspect;
  result[5] = f;
  result[10] = (far + near) * nf;
  result[11] = -1;
  result[14] = 2 * far * near * nf;

  return result;
}

export function createViewMatrix(camera: CameraState): Float32Array {
  const [px, py, pz] = camera.position;
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const forwardX = sinYaw * cosPitch;
  const forwardY = sinPitch;
  const forwardZ = -cosYaw * cosPitch;

  const rightX = cosYaw;
  const rightY = 0;
  const rightZ = sinYaw;

  const upX = -sinYaw * sinPitch;
  const upY = cosPitch;
  const upZ = cosYaw * sinPitch;

  const result = new Float32Array(16);

  result[0] = rightX;
  result[1] = upX;
  result[2] = -forwardX;
  result[3] = 0;

  result[4] = rightY;
  result[5] = upY;
  result[6] = -forwardY;
  result[7] = 0;

  result[8] = rightZ;
  result[9] = upZ;
  result[10] = -forwardZ;
  result[11] = 0;

  result[12] = -(rightX * px + rightY * py + rightZ * pz);
  result[13] = -(upX * px + upY * py + upZ * pz);
  result[14] = forwardX * px + forwardY * py + forwardZ * pz;
  result[15] = 1;

  return result;
}

export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 4 + k] * b[k * 4 + col];
      }
      result[row * 4 + col] = sum;
    }
  }
  return result;
}
