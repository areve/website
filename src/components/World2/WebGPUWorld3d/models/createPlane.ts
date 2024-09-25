import createPlaneWgsl from "./createPlane.wgsl";

import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import {
  createVertexBuffer,
  createIndexBuffer,
  createRenderPipelineBuilder,
} from "../lib/buffer";

export function createPlane(
  device: GPUDevice,
  getWorldMapParams: () => Float32Array,
  getCamera: () => Camera,
  buffer: GPUBuffer,
  width: number,
  height: number
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

  const getTextureDimensions = () => new Uint32Array([width, height]);

  const { pipeline, bind, updateBuffers } = createRenderPipelineBuilder(device)
    .createUniformBuffer(
      getWorldMapParams,
      getTransformMatrix,
      getTextureDimensions
    )
    .addBuffer({
      buffer,
      type: "read-only-storage",
    })
    .setGeometry(geometry)
    .setVertexModule(createPlaneWgsl)
    .setFragmentModule(createPlaneWgsl)
    .create();

  function render(renderPass: GPURenderPassEncoder) {
    bind(renderPass);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32");
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);
  }

  return {
    transform,
    pipeline,
    render,
    updateBuffers,
  };
}
