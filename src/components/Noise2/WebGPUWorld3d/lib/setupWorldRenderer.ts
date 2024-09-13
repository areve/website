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

  const pipeline = createPipeline(device, cube.layout, presentationFormat);

  const fragmentUniforms = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    get buffer() {
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

  const uniformBuffer = device.createBuffer({
    size: 1024 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformBindGroup0 = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: fragmentUniforms.buffer.byteLength + 100,
        },
      },
    ],
  });

  const uniformBindGroup1 = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 256,
          size: mat4.create().byteLength + 100,
        },
      },
    ],
  });

  const uniformBindGroup2 = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 512,
          size: mat4.create().byteLength + 100,
        },
      },
    ],
  });

  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));

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
      Object.assign(fragmentUniforms, data);
      const t = time * 0.001;
      fragmentUniforms.z = t;
      cube.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      device.queue.writeBuffer(uniformBuffer, 0, fragmentUniforms.buffer);
      device.queue.writeBuffer(
        uniformBuffer,
        256,
        cube.matrix(viewMatrix, projectionMatrix)
      );
      device.queue.writeBuffer(
        uniformBuffer,
        512,
        plane.matrix(viewMatrix, projectionMatrix)
      );

      const pass = renderer.initFrame(context);

      pass.setPipeline(pipeline);

      pass.setVertexBuffer(0, cube.buffer);
      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup1);
      pass.draw(cube.geometry.vertexCount);

      pass.setVertexBuffer(0, plane.buffer);
      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup2);
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
