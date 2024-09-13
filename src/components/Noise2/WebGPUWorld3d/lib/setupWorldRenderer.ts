import { mat4, vec3 } from "wgpu-matrix";
import {
  cubeVertexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeUVOffset,
  cubeVertexCount,
} from "./cube";
import vertexWgsl from "./vertex.wgsl?raw";
import fragmentWgsl from "./fragment.wgsl?raw";
import { plainVertexArray, plainVertexCount } from "./plain";

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

  const verticesBuffer = createVerticesBuffer(cubeVertexArray);

  const plainVerticesBuffer = createVerticesBuffer(plainVertexArray);

  function createVerticesBuffer(vertexArray: Float32Array) {
    const verticesBuffer = device.createBuffer({
      label: "cube",
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Float32Array(verticesBuffer.getMappedRange()).set(vertexArray);
    verticesBuffer.unmap();
    return verticesBuffer;
  }

  // const bindGroupLayout0 = device.createBindGroupLayout({
  //   entries: [
  //     {
  //       binding: 0,
  //       visibility: GPUShaderStage.FRAGMENT,
  //       buffer: { type: "storage" },
  //     },
  //   ],
  // });

  // const bindGroupLayout1 = device.createBindGroupLayout({
  //   entries: [
  //     {
  //       binding: 0,
  //       visibility: GPUShaderStage.FRAGMENT,
  //       buffer: { type: "storage" },
  //     },
  //   ],
  // });

  // const pipelineLayout = device.createPipelineLayout({
  //   bindGroupLayouts: [bindGroupLayout0, bindGroupLayout1],
  // });

  const pipeline = device.createRenderPipeline({
    label: "blah pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: vertexWgsl,
      }),
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: "float32x4",
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUVOffset,
              format: "float32x2",
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: fragmentWgsl,
      }),
      targets: [{ format: presentationFormat }],
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

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const fragmentUniforms = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    asBuffer() {
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

  function createVertexUniforms() {
    return {
      modelViewProjectionMatrix: mat4.create(), // temp
      asBuffer() {
        return new Float32Array(
          new Float32Array(this.modelViewProjectionMatrix.buffer)
        );
      },
    };
  }

  const uniformBuffer = device.createBuffer({
    size: 1024,
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
          size: fragmentUniforms.asBuffer().byteLength + 100,
        },
      },
    ],
  });

  const a1 = createVertexUniforms();
  const a2 = createVertexUniforms();

  const uniformBindGroup1 = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 256,
          size: a1.asBuffer().byteLength + 100,
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
          size: a2.asBuffer().byteLength + 100,
        },
      },
    ],
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

  const modelMatrix1 = mat4.translation(vec3.create(-2, 2, 0));
  const modelMatrix2 = mat4.translation(vec3.create(2, 2, 0));
  const modelViewProjectionMatrix1 = mat4.create();
  const modelViewProjectionMatrix2 = mat4.create();
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
    mat4.rotate(
      modelMatrix2,
      vec3.fromValues(Math.cos(now), Math.sin(now), 0),
      1,
      tmpMat42
    );

    mat4.multiply(viewMatrix, tmpMat41, modelViewProjectionMatrix1);
    mat4.multiply(
      projectionMatrix,
      modelViewProjectionMatrix1,
      modelViewProjectionMatrix1
    );
    mat4.multiply(viewMatrix, tmpMat42, modelViewProjectionMatrix2);
    mat4.multiply(
      projectionMatrix,
      modelViewProjectionMatrix2,
      modelViewProjectionMatrix2
    );
  }

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

      device.queue.writeBuffer(uniformBuffer, 0, fragmentUniforms.asBuffer());

      a1.modelViewProjectionMatrix.set(modelViewProjectionMatrix1);
      device.queue.writeBuffer(uniformBuffer, 256, a1.asBuffer());

      a2.modelViewProjectionMatrix.set(modelViewProjectionMatrix2);
      device.queue.writeBuffer(uniformBuffer, 512, a2.asBuffer());

      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "our encoder" });

      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, verticesBuffer);

      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup1);
      pass.draw(cubeVertexCount);

      pass.setVertexBuffer(0, plainVerticesBuffer);
      pass.setBindGroup(0, uniformBindGroup0);
      pass.setBindGroup(1, uniformBindGroup2);
      pass.draw(plainVertexCount);

      pass.end();
      device.queue.submit([encoder.finish()]);

      return device.queue.onSubmittedWorkDone();
    },
  };
}
