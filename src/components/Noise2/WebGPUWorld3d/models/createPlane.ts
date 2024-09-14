import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import vertexWgsl from "../shaders/worldVertex.wgsl?raw";
import fragmentWgsl from "../shaders/worldFragment.wgsl?raw";
import { createModelBuffer, createUniformBuffer } from "../lib/buffer";
import { createLayout } from "../lib/webgpu";

export function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const geometry = createPlaneGeometry("plane");
  const modelBuffer = createModelBuffer(device, geometry);
  const layout = createLayout(geometry);
  
  const transform = {
    translation: vec3.create(-3, -2, 0),
    rotation: vec3.create(-0.2, 0, 0),
  };

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: vertexWgsl,
      }),
      buffers: [layout],
    },
    fragment: {
      module: device.createShaderModule({
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
    renderPass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    renderPass.draw(geometry.vertexCount);
  }

  return { transform, pipeline, buffers, render, updateBuffers };
}
