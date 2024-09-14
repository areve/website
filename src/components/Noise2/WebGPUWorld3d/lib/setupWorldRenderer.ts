import { mat4, vec3 } from "wgpu-matrix";
import { createCube } from "./cube";
import vertexWgsl from "./vertex.wgsl?raw";
import fragmentWgsl from "./fragment.wgsl?raw";
import { createPlane } from "./plane";

export async function setupWorldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 8,
    options.width / options.height,
    1,
    100.0
  );
  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const cube = createModel(device, createCube("cube"));
  cube.translation = vec3.create(-1, 3, -4);

  const plane = createModel(device, createPlane("plane"));
  plane.rotation = vec3.create(-0.2, 0, 0);
  plane.translation = vec3.create(-3, -2, 0);

  const commonLayout = cube.layout;

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

  const pipeline1 = createPipeline(device, commonLayout, presentationFormat);

  const uniformBufferInfo1 = {
    uniformBuffer: device.createBuffer({
      size: getSizeFor(
        worldMapUniforms.toBuffer(),
        cube.matrix(viewMatrix, projectionMatrix)
      ),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
    offset: 0,
  };

  const buffers1 = {
    worldMapUniforms: createBuffer(
      device,
      uniformBufferInfo1,
      pipeline1.getBindGroupLayout(0),
      () => worldMapUniforms.toBuffer()
    ),
    cubeMatrix: createBuffer(
      device,
      uniformBufferInfo1,
      pipeline1.getBindGroupLayout(1),
      () => cube.matrix(viewMatrix, projectionMatrix)
    ),
  };

  const planePipeline = createPipeline(
    device,
    commonLayout,
    presentationFormat
  );

  const uniformBufferInfo2 = {
    uniformBuffer: device.createBuffer({
      size: getSizeFor(
        worldMapUniforms.toBuffer(),
        plane.matrix(viewMatrix, projectionMatrix)
      ),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
    offset: 0,
  };

  const planeBuffers = {
    worldMapUniforms: createBuffer(
      device,
      uniformBufferInfo2,
      planePipeline.getBindGroupLayout(0),
      () => worldMapUniforms.toBuffer()
    ),
    planeMatrix: createBuffer(
      device,
      uniformBufferInfo2,
      planePipeline.getBindGroupLayout(1),
      () => plane.matrix(viewMatrix, projectionMatrix)
    ),
  };

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
      cube.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      for (const [_, v] of Object.entries(buffers1)) {
        device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
      }

      for (const [_, v] of Object.entries(planeBuffers)) {
        device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
      }

      const pass = renderer.initFrame(context);

      pass.setPipeline(pipeline1);
      pass.setVertexBuffer(0, cube.buffer);
      pass.setBindGroup(0, buffers1.worldMapUniforms.bindGroup);
      pass.setBindGroup(1, buffers1.cubeMatrix.bindGroup);
      pass.draw(cube.geometry.vertexCount);

      pass.setPipeline(planePipeline);
      pass.setVertexBuffer(0, plane.buffer);
      pass.setBindGroup(0, planeBuffers.worldMapUniforms.bindGroup);
      pass.setBindGroup(1, planeBuffers.planeMatrix.bindGroup);
      pass.draw(plane.geometry.vertexCount);

      renderer.end();

      return device.queue.onSubmittedWorkDone();
    },
  };
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

function createPipeline(
  device: GPUDevice,
  layout: GPUVertexBufferLayout,
  presentationFormat: string
) {
  return device.createRenderPipeline({
    label: "blah pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: vertexWgsl,
      }),
      buffers: [layout],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: fragmentWgsl,
      }),
      targets: [{ format: presentationFormat } as GPUColorTargetState],
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
}

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

function getSizeFor(...buffers: Float32Array[]) {
  return buffers.reduce(
    (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
    0
  );
}
