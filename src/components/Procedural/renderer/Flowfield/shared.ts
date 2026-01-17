export function setupShared(
  device: GPUDevice,
  options: { width: number; height: number; seed: number; scale: number }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 100,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotate: 0.0,
    asBuffer() {
      const buf = new ArrayBuffer(12 * 4);
      const f32 = new Float32Array(buf);
      const u32 = new Uint32Array(buf);
      f32[0] = this.width;
      f32[1] = this.height;
      u32[2] = (this.seed as number) >>> 0;
      f32[3] = this.scale;
      f32[4] = this.x;
      f32[5] = this.y;
      f32[6] = this.z;
      f32[7] = this.zoom;
      f32[8] = this.rotate;
      return f32;
    },
  };

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { sharedData, dataBuffer };
}
