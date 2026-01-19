export function setupSharedResources(
  device: GPUDevice,
  options: { width: number; height: number; seed?: number; scale?: number }
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
    rotation: 0.0,
    asBuffer() {
      // layout: 0..8 original entries, then a00,a01,a10,a11,bx,by (6 floats)
      const buf = new ArrayBuffer(18 * 4);
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
      f32[8] = this.rotation;
      // compute sampling transform A (rotation) and bias b so shaders share same mapping
      const c = Math.cos(this.rotation);
      const s = Math.sin(this.rotation);
      const a00 = c;
      const a01 = -s;
      const a10 = s;
      const a11 = c;
      const cx = (this.width * 0.5) / this.scale * this.zoom + this.x / this.scale;
      const cy = (this.height * 0.5) / this.scale * this.zoom + this.y / this.scale;
      const bx = (1 - c) * cx + s * cy;
      const by = -s * cx + (1 - c) * cy;
      f32[9] = a00;
      f32[10] = a01;
      f32[11] = a10;
      f32[12] = a11;
      f32[13] = bx;
      f32[14] = by;
      return f32;
    },
  };

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { sharedData, dataBuffer };
}
