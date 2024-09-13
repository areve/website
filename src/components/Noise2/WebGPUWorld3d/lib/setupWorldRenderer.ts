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

  const cube = createCube("cube");
  const cubeVertexBuffer = createVertexBuffer(device, cube);

  const plane = createPlane("plane");
  const planeVerticesBuffer = createVertexBuffer(device, plane);

  const pipeline = createPipeline(
    device,
    cubeVertexBuffer.layout,
    presentationFormat
  );

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

  // function createVertexUniforms() {
  //   return {
  //     modelViewProjectionMatrix: mat4.create(), // temp
  //     asBuffer() {
  //       return new Float32Array(this.modelViewProjectionMatrix.buffer);
  //     },
  //   };
  // }

  const uniformBuffer = device.createBuffer({
    size: 1024 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // console.log(sharedData.asBuffer().byteLength)
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

  const cubeMatrix = mat4.create();
  const planeMatrix = mat4.create();

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

  const modelMatrix1 = mat4.translation(vec3.create(-1, 3, -4));
  const modelMatrix2 = mat4.translation(vec3.create(-3, -2, 0));

  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));

  const tmpMat41 = mat4.create();
  const tmpMat42 = mat4.create();
  function updateTransformationMatrix() {
    const now = Date.now() / 1000;

    mat4.rotate(
      modelMatrix1,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      1,
      tmpMat41
    );

    mat4.rotate(modelMatrix2, vec3.fromValues(-0.2, 0, 0), 1, tmpMat42);

    mat4.multiply(viewMatrix, tmpMat41, cubeMatrix);
    mat4.multiply(projectionMatrix, cubeMatrix, cubeMatrix);
    mat4.multiply(viewMatrix, tmpMat42, planeMatrix);
    mat4.multiply(projectionMatrix, planeMatrix, planeMatrix);
  }

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
      fragmentUniforms.z = time * 0.001;
      updateTransformationMatrix();

      device.queue.writeBuffer(uniformBuffer, 0, fragmentUniforms.buffer);
      device.queue.writeBuffer(uniformBuffer, 256, cubeMatrix.buffer);
      device.queue.writeBuffer(uniformBuffer, 512, planeMatrix.buffer);

      const pass = renderer.initFrame(context);

      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, cubeVertexBuffer.buffer);

      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup1);
      pass.draw(cube.vertexCount);

      pass.setVertexBuffer(0, planeVerticesBuffer.buffer);
      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup2);
      pass.draw(plane.vertexCount);

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

function createVertexBuffer(
  device: GPUDevice,
  geometry: {
    vertexArray: Float32Array;
    label: string;
    vertexSize: number;
    positionOffset: number;
    uvOffset: number;
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
  };
}
