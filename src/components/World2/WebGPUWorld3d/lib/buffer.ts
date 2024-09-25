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
  type: "uniform" | "storage" | "read-only-storage";
  offset?: number;
  size?: number;
}

export function createLayoutBuilder(
  device: GPUDevice,
  visibility: "compute" | "render"
) {
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
            visibility:
              visibility == "render"
                ? GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT
                : GPUShaderStage.COMPUTE,
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
              offset: bufferInfo.offset || 0,
              size: bufferInfo.size || bufferInfo.buffer.size,
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
  entryPoint?: string;
  layout?: Iterable<GPUVertexBufferLayout | null>;
}

export function createComputePipelineBuilder(device: GPUDevice) {
  const layoutBuilder = createLayoutBuilder(device, "compute");
  let computeModule: CodeInfo;
  const builder = {
    addBuffer: (bufferInfo: BufferInfo) => {
      layoutBuilder.addBuffer(bufferInfo);
      return builder;
    },
    setComputeModule(codeInfo: CodeInfo) {
      computeModule = codeInfo;
      return builder;
    },
    create() {
      const { layout, bindGroups } = layoutBuilder.create();

      const pipeline = device.createComputePipeline({
        layout,
        compute: {
          module: device.createShaderModule({
            code: computeModule.code,
          }),
          entryPoint: computeModule.entryPoint,
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

export function createRenderPipelineBuilder(device: GPUDevice) {
  const layoutBuilder = createLayoutBuilder(device, "render");
  let vertexModule: CodeInfo;
  let fragmentModule: CodeInfo;
  let uniformBufferInfos: {
    buffer: GPUBuffer;
    offset: number;
    size: number;
    end: number;
    getBuffer: () => ArrayBufferLike;
    update: () => void;
  }[] = [];

  const builder = {
    createUniformBuffer: (...getBuffers: (() => ArrayBufferLike)[]) => {
      const bufferOffsets = getBufferOffsets(...getBuffers);
      const lastBufferOffset = bufferOffsets.at(-1);
      if (!lastBufferOffset)
        throw new Error("bufferOffsets must have at least one element");
      const uniformBuffer = createUniformBuffer(device, lastBufferOffset.end);
      bufferOffsets.forEach((bufferOffset) => {
        builder.addBuffer({
          buffer: uniformBuffer,
          offset: bufferOffset.offset,
          size: bufferOffset.size,
          type: "uniform",
        });
        uniformBufferInfos.push({
          ...bufferOffset,
          buffer: uniformBuffer,
          update: () => {
            device.queue.writeBuffer(
              uniformBuffer,
              bufferOffset.offset,
              bufferOffset.getBuffer()
            );
          },
        });
      });

      return builder;
    },
    addBuffer: (bufferInfo: BufferInfo) => {
      layoutBuilder.addBuffer(bufferInfo);
      return builder;
    },
    setVertexModule(codeInfo: CodeInfo) {
      vertexModule = codeInfo;
      return builder;
    },
    setFragmentModule(codeInfo: CodeInfo) {
      fragmentModule = codeInfo;
      return builder;
    },
    create() {
      const { layout, bindGroups } = layoutBuilder.create();

      const pipeline = device.createRenderPipeline({
        layout,
        vertex: {
          module: device.createShaderModule({
            code: vertexModule.code,
          }),
          buffers: vertexModule.layout,
          entryPoint: vertexModule.entryPoint,
        },
        fragment: {
          module: device.createShaderModule({
            code: fragmentModule.code,
          }),
          entryPoint: fragmentModule.entryPoint,
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat(),
            } as GPUColorTargetState,
          ],
        },
        primitive: {
          topology: "triangle-list",
          cullMode: "back",
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: "less",
          format: "depth24plus",
        },
      });
      return {
        pipeline,
        bindGroups,
        uniformBufferInfos,
      };
    },
  };

  return builder;
}
