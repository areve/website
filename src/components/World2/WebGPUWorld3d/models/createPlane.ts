import createPlaneWgsl from "./createPlane.wgsl";

import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import {
  createVertexBuffer,
  createIndexBuffer,
  getBufferOffsets,
  createRenderPipelineBuilder,
} from "../lib/buffer";

export function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera,
  texture: {
    buffer: GPUBuffer;
    width: number;
    height: number;
  }
) {
  const geometry = createPlaneGeometry("plane", 10, 10, 500, 500);
  const vertexBuffer = createVertexBuffer(device, geometry);
  const indexBuffer = createIndexBuffer(device, geometry);

  const transform = {
    translation: vec3.create(-5, -5, 0),
    rotation: vec3.create(0, 0, 0),
  };

  const getTransformMatrix = () =>
    applyCamera(transform.translation, transform.rotation, getCamera());

  const getTextureDimensions = () =>
    new Uint32Array([texture.width, texture.height]);

  const {
    pipeline,
    bindGroups: [
      worldMapBindGroup,
      planeMatrixBindGroup,
      computeForRenderBindGroup,
      textureDimensionsBindGroup,
    ],
    uniformBufferInfos: [
      worldMapUniform,
      cameraMatrixUniform,
      textureDimensionsUniform,
    ],
  } = createRenderPipelineBuilder(device)
    .createUniformBuffer(
      getWorldMapUniforms,
      getTransformMatrix,
      getTextureDimensions
    )
    .addBuffer({
      buffer: texture.buffer,
      type: "read-only-storage",
    })
    .setVertexModule({
      code: createPlaneWgsl,
      layout: geometry.layout,
    })
    .setFragmentModule({
      code: createPlaneWgsl,
    })
    .create();

  function updateBuffers() {
    worldMapUniform.update();
    cameraMatrixUniform.update();
    textureDimensionsUniform.update();
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32");
    renderPass.setBindGroup(0, worldMapBindGroup);
    renderPass.setBindGroup(1, planeMatrixBindGroup);
    renderPass.setBindGroup(2, computeForRenderBindGroup);
    renderPass.setBindGroup(3, textureDimensionsBindGroup);
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);
  }

  return {
    transform,
    pipeline,
    render,
    updateBuffers,
  };
}
