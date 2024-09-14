import { mat4, vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometry/cube";
import vertexWgsl from "./vertex.wgsl?raw";
import fragmentWgsl from "./fragment.wgsl?raw";
import { createPlaneGeometry } from "../geometry/plane";
import { Camera, createUniformBuffer, getDeviceContext } from "./webgpu";



export async function setupWorldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const { device, context } = await getDeviceContext(
    canvas,
    options.width,
    options.height
  );

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

  const camera = createCamera(options.width, options.height);

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
      const t = time * 0.001;
      if (data?.x !== undefined) worldMapUniforms.x = data.x;
      if (data?.y !== undefined) worldMapUniforms.y = data.y;
      worldMapUniforms.z = t;
      cube.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      cube.updateBuffers();
      plane.updateBuffers();

      const renderPass = renderer.start(context);
      cube.render(renderPass);
      plane.render(renderPass);
      return renderer.end();
    },
  };
}

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
  const geometry = createCubeGeometry("cube");
  // const model = createModel(device, geometry);

  const modelBuffer = createModelBuffer(device, geometry);

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

  const translation = vec3.create(-1, 3, -4);
  const rotation = vec3.create(0, 0, 0);

  const pipeline = device.createRenderPipeline({
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

  const result = { translation, rotation, pipeline, render, updateBuffers };

  const buffers = createUniformBuffer(device, pipeline, {
    worldMapUniforms: {
      layout: 0,
      getBuffer: getWorldMapUniforms,
    },
    cubeMatrix: {
      layout: 1,
      getBuffer: () =>
        applyCamera(result.translation, result.rotation, getCamera()),
    },
  });

  function updateBuffers() {
    for (const [_, v] of Object.entries(buffers)) {
      device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
    }
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, modelBuffer);
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.cubeMatrix.bindGroup);
    renderPass.draw(geometry.vertexCount);
  }

  result.buffers = buffers;
  
  return result;
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
      getBuffer: () => model.matrix(getCamera()),
    },
  });

  function updateBuffers() {
    for (const [_, v] of Object.entries(buffers)) {
      device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
    }
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, model.buffer);
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    renderPass.draw(model.geometry.vertexCount);
  }
  return { model, pipeline, buffers, render, updateBuffers };
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
  const buffer = createModelBuffer(device, geometry);

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
    matrix(camera: Camera) {
      return applyCamera(this.translation, this.rotation, camera);
    },
  };
}

function applyCamera(
  translation: Float32Array, // vec3
  rotation: Float32Array, // vec3
  camera: Camera
) {
  const result = mat4.create();
  mat4.translation(translation, result);
  mat4.rotate(result, rotation, 1, result);
  mat4.multiply(camera.viewMatrix, result, result);
  mat4.multiply(camera.projectionMatrix, result, result);
  return result;
}

function createModelBuffer(
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
  return buffer;
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
    start(context: GPUCanvasContext) {
      colorAttachment.view = context.getCurrentTexture().createView();
      this.encoder = device.createCommandEncoder({ label: "our encoder" });
      this.pass = this.encoder.beginRenderPass(renderPassDescriptor);
      return this.pass;
    },
    end() {
      if (this.pass) this.pass.end();
      if (this.encoder) device.queue.submit([this.encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
