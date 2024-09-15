import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
// import vertexWgsl from "../shaders/worldVertex.wgsl?raw";
import fragmentWgsl from "../shaders/worldFragment.wgsl?raw";
import { createVertexBuffer, createUniformBuffer, createIndexBuffer } from "../lib/buffer";
import { createLayout } from "../lib/webgpu";

export function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const geometry = createPlaneGeometry("plane", 10, 10, 500, 500);
  const vertexBuffer = createVertexBuffer(device, geometry);
  const indexBuffer = createIndexBuffer(device, geometry);
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
      {
        // faceCoord
        shaderLocation: 2,
        offset: geometry.faceCoordOffset,
        format: "float32x2",
      },
    ],
  };

  const transform = {
    translation: vec3.create(-5, -2, 0),
    rotation: vec3.create(-0.2, 0, 0),
  };

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: fragmentWgsl,
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
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint32'); // Or 'uint16' if using smaller indices
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    // renderPass.draw(geometry.vertexCount);
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);

  }

  return { transform, pipeline, buffers, render, updateBuffers };
}
