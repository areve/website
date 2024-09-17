import { Geometry } from "./webgpu";

export type BufferInfo = {
  layout: number;
  getBuffer: () => Float32Array;
};

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

export function createUniformBuffer<T extends Record<string, BufferInfo>>(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  bufferInfo: T
) {
  const buffers: Float32Array[] = [];
  for (const key in bufferInfo) {
    if (bufferInfo.hasOwnProperty(key)) {
      const b = bufferInfo[key] as {
        layout: number;
        getBuffer: () => Float32Array;
      };
      buffers.push(b.getBuffer());
    }
  }

  const uniformBuffer = {
    uniformBuffer: device.createBuffer({
      size: getSizeFor(buffers),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
    offset: 0,
  };

  const result = {} as {
    [K in keyof T]: {
      bindGroup: GPUBindGroup;
      getBuffer: () => Float32Array;
      buffer: GPUBuffer;
      offset: number;
    };
  };

  for (const key in bufferInfo) {
    if (bufferInfo.hasOwnProperty(key)) {
      const b = bufferInfo[key] as {
        layout: number;
        getBuffer: () => Float32Array;
      };
      result[key] = createBuffer(
        device,
        uniformBuffer,
        pipeline.getBindGroupLayout(b.layout), // TODO pipeline1?
        b.getBuffer
      );
    }
  }

  return result;

  function getSizeFor(buffers: Float32Array[]) {
    return buffers.reduce(
      (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
      0
    );
  }

  function createBuffer(
    device: GPUDevice,
    uniformBufferInfo: { uniformBuffer: GPUBuffer; offset: number },
    layout: GPUBindGroupLayout,
    getBuffer: () => Float32Array
  ): {
    bindGroup: GPUBindGroup;
    getBuffer: () => Float32Array;
    buffer: GPUBuffer;
    offset: number;
  } {
    const offset = uniformBufferInfo.offset;
    const size = getBuffer().byteLength;
    uniformBufferInfo.offset = offset + Math.ceil(size / 256) * 256;
    const bindGroup = device.createBindGroup({
      layout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBufferInfo.uniformBuffer,
            offset,
            size,
          },
        },
      ],
    });

    return {
      bindGroup,
      getBuffer,
      buffer: uniformBufferInfo.uniformBuffer,
      offset,
    };
  }
}