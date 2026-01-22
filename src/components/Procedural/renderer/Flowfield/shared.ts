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
    // frame counter incremented by the renderer when a new frame is processed
    frame: 0,
    zoom: 1,
    rotation: 0,
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.frame,
        this.zoom,
        this.rotation,
      ]);
    },
  };

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { sharedData, dataBuffer };
}
