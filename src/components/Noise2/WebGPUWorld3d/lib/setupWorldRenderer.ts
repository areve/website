import { mat4, vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "./cube";
import vertexWgsl from "./vertex.wgsl?raw";
import fragmentWgsl from "./fragment.wgsl?raw";
import { createPlaneGeometry } from "./plane";

export async function setupWorldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const camera = createCamera(options.width, options.height);
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
  });

  const worldMapUniforms = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    toBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
      ]);
    },
  };

  const cube = createCube(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera
  );

  const plane = createPlane(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera
  );

  const renderer = createRenderer(device, options.width, options.height);

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      Object.assign(worldMapUniforms, data);
      const t = time * 0.001;
      worldMapUniforms.z = t;
      cube.model.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      for (const [_, v] of Object.entries(cube.buffers)) {
        device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
      }

      for (const [_, v] of Object.entries(plane.buffers)) {
        device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
      }

      const renderPass = renderer.initFrame(context);
      cube.render(renderPass);
      plane.render(renderPass);
      renderer.end();

      return device.queue.onSubmittedWorkDone();
    },
  };
}

type Camera = {
  viewMatrix: Float32Array;
  projectionMatrix: Float32Array;
};

function createCamera(width: number, height: number): Camera {
  const projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 8,
    width / height,
    1,
    100.0
  );
  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));
  const camera = {
    viewMatrix,
    projectionMatrix,
  };
  return { viewMatrix, projectionMatrix };
}

function createCube(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const model = createModel(device, createCubeGeometry("cube"));
  model.translation = vec3.create(-1, 3, -4);

  const pipeline = device.createRenderPipeline({
    label: "blah pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: vertexWgsl,
      }),
      buffers: [model.layout],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: fragmentWgsl,
      }),
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
  const buffers = createUniformBuffer(device, pipeline, {
    worldMapUniforms: {
      layout: 0,
      getBuffer: getWorldMapUniforms,
    },
    cubeMatrix: {
      layout: 1,
      getBuffer: () => {
        const camera = getCamera();
        return model.matrix(camera.viewMatrix, camera.projectionMatrix);
      },
    },
  });

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, model.buffer);
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.cubeMatrix.bindGroup);
    renderPass.draw(model.geometry.vertexCount);
  }
  return { buffers, pipeline, model, render };
}

function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const model = createModel(device, createPlaneGeometry("plane"));
  model.rotation = vec3.create(-0.2, 0, 0);
  model.translation = vec3.create(-3, -2, 0);

  const pipeline = device.createRenderPipeline({
    label: "blah pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: vertexWgsl,
      }),
      buffers: [model.layout],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: fragmentWgsl,
      }),
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
  const buffers = createUniformBuffer(device, pipeline, {
    worldMapUniforms: {
      layout: 0,
      getBuffer: getWorldMapUniforms,
    },
    planeMatrix: {
      layout: 1,
      getBuffer: () => {
        const camera = getCamera();
        return model.matrix(camera.viewMatrix, camera.projectionMatrix);
      },
    },
  });

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, model.buffer);
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    renderPass.draw(model.geometry.vertexCount);
  }
  return { buffers, pipeline, model, render };
}

function createRenderer(device: GPUDevice, width: number, height: number) {
  const depthTexture = device.createTexture({
    size: [width, height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };
  return {
    descriptor: renderPassDescriptor,
    encoder: null as GPUCommandEncoder | null,
    pass: null as GPURenderPassEncoder | null,
    initFrame(context: GPUCanvasContext) {
      colorAttachment.view = context.getCurrentTexture().createView();
      this.encoder = device.createCommandEncoder({ label: "our encoder" });
      this.pass = this.encoder.beginRenderPass(renderPassDescriptor);
      return this.pass;
    },
    end() {
      if (this.pass) this.pass.end();
      if (this.encoder) device.queue.submit([this.encoder.finish()]);
    },
  };
}

type Model = ReturnType<typeof createModel>;
function createModel(
  device: GPUDevice,
  geometry: {
    vertexArray: Float32Array;
    label: string;
    vertexSize: number;
    positionOffset: number;
    uvOffset: number;
    vertexCount: number;
  }
) {
  const buffer = device.createBuffer({
    label: geometry.label,
    size: geometry.vertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  new Float32Array(buffer.getMappedRange()).set(geometry.vertexArray);
  buffer.unmap();

  const layout: GPUVertexBufferLayout = {
    arrayStride: geometry.vertexSize,
    attributes: [
      {
        // position
        shaderLocation: 0,
        offset: geometry.positionOffset,
        format: "float32x4",
      },
      {
        // uv
        shaderLocation: 1,
        offset: geometry.uvOffset,
        format: "float32x2",
      },
    ],
  };
  return {
    buffer,
    layout,
    translation: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    geometry,
    matrix(viewMatrix: Float32Array, projectionMatrix: Float32Array) {
      return applyMatrix(
        this.translation,
        this.rotation,
        viewMatrix,
        projectionMatrix
      );
    },
  };
}

function applyMatrix(
  translation: Float32Array, // vec3
  rotation: Float32Array, // vec3
  viewMatrix: Float32Array, // matrix44
  projectionMatrix: Float32Array // matrix44
) {
  const result = mat4.create();
  mat4.translation(translation, result);
  mat4.rotate(result, rotation, 1, result);
  mat4.multiply(viewMatrix, result, result);
  mat4.multiply(projectionMatrix, result, result);
  return result;
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
  console.log(offset, size);
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

function getSizeFor(buffers: Float32Array[]) {
  return buffers.reduce(
    (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
    0
  );
}

type BufferInfo = {
  layout: number;
  getBuffer: () => Float32Array;
};

function createUniformBuffer<T extends Record<string, BufferInfo>>(
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
}
