import { Geometry } from "./webgpu";

export function createVertexBuffer(device: GPUDevice, geometry: Geometry) {
  const buffer = device.createBuffer({
    label: geometry.label + " vertex buffer",
    size: geometry.vertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  new Float32Array(buffer.getMappedRange()).set(geometry.vertexArray);
  buffer.unmap();
  return buffer;
}

export function createIndexBuffer(device: GPUDevice, geometry: Geometry) {
  const buffer = device.createBuffer({
    label: geometry.label + " index buffer",
    size: geometry.indexArray.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  new Uint32Array(buffer.getMappedRange()).set(geometry.indexArray);
  buffer.unmap();
  return buffer;
}

export function calculateBufferSizeFor(buffers: Float32Array[]) {
  return buffers.reduce(
    (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
    0
  );
}
