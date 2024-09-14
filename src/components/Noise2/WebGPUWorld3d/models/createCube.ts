import { vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometries/cube";
import vertexWgsl from "../shaders/worldVertex.wgsl?raw";
import fragmentWgsl from "../shaders/worldFragment.wgsl?raw";
import { createModelBuffer, createUniformBuffer } from "../lib/buffer";
import { applyCamera, Camera } from "../lib/camera";

export function createCube(
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

  const transform = {
    translation: vec3.create(-1, 3, -4),
    rotation: vec3.create(0, 0, 0),
  };

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

  const buffers = createUniformBuffer(device, pipeline, {
    worldMapUniforms: {
      layout: 0,
      getBuffer: getWorldMapUniforms,
    },
    cubeMatrix: {
      layout: 1,
      getBuffer: () =>
        applyCamera(transform.translation, transform.rotation, getCamera()),
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

  return { transform, pipeline, render, updateBuffers };
}
