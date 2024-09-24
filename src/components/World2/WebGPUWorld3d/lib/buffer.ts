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

export function createUniformBuffer(device: GPUDevice, size: number) {
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

export function createStorageBuffer(device: GPUDevice, size: number) {
  return device.createBuffer({
    size,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
}

export function createReadBackBuffer(device: GPUDevice, size: number) {
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
}

export function getBufferOffsets(...getBuffers: (() => ArrayBufferLike)[]) {
  let next = 0;
  return getBuffers.map((getBuffer) => {
    const size = getBuffer().byteLength;
    const reserved = Math.ceil(size / 256) * 256;
    const offset = next;
    next = offset + reserved;
    return { offset, size, end: next, getBuffer };
  });
}


export interface BufferInfo {
  buffer: GPUBuffer;
  type: "uniform" | "storage";
}

export function createLayoutBuilder(device: GPUDevice) {
  const bufferInfos: BufferInfo[] = [];
  const builder = {
    addBuffer,
    create,
  };

  function addBuffer(bufferInfo: BufferInfo) {
    bufferInfos.push(bufferInfo);
    return builder;
  }

  function create() {
    const bindGroupLayouts: GPUBindGroupLayout[] = [];
    const bindGroups: GPUBindGroup[] = [];

    bufferInfos.forEach((bufferInfo) => {
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: bufferInfo.type,
            },
          },
        ],
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: bufferInfo.buffer,
              offset: 0,
              size: bufferInfo.buffer.size,
            },
          },
        ],
      });

      bindGroupLayouts.push(bindGroupLayout);
      bindGroups.push(bindGroup);
    });

    const layout = device.createPipelineLayout({ bindGroupLayouts });
    return { layout, bindGroups };
  }

  return builder;
}


export interface CodeInfo {
  code: string;
  entryPoint: string;
}

export function createPipelineBuilder(device: GPUDevice) {
  const layoutBuilder = createLayoutBuilder(device);
  const builder = {
    addBuffer: (bufferInfo: BufferInfo) => {
      layoutBuilder.addBuffer(bufferInfo);
      return builder;
    },
    create(codeInfo: CodeInfo) {
      const { layout, bindGroups } = layoutBuilder.create();

      const pipeline = device.createComputePipeline({
        layout,
        compute: {
          module: device.createShaderModule({
            code: codeInfo.code,
          }),
          entryPoint: codeInfo.entryPoint,
        },
      });
      return {
        pipeline,
        layout,
        bindGroups,
      };
    },
  };

  return builder;
}
