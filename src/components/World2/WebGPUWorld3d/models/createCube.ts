import createCubeVertWgsl from "./createCube.vert";
import createCubeFragWgsl from "./createCube.frag";
import { vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometries/cube";
import { createRenderPipelineBuilder, createVertexBuffer } from "../lib/buffer";
import { applyCamera, Camera } from "../lib/camera";

export function createCube(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const geometry = createCubeGeometry("cube");
  const modelBuffer = createVertexBuffer(device, geometry);

  const transform = {
    translation: vec3.create(0, 0, 4),
    rotation: vec3.create(0, 0, 0),
  };
  const getTransformMatrix = () =>
    applyCamera(transform.translation, transform.rotation, getCamera());

  const { pipeline, bind, updateBuffers } = createRenderPipelineBuilder(device)
    .createUniformBuffer(getWorldMapUniforms, getTransformMatrix)
    .setVertexModule({
      code: createCubeVertWgsl,
      layout: geometry.layout,
    })
    .setFragmentModule({
      code: createCubeFragWgsl,
    })
    .create();

  function render(renderPass: GPURenderPassEncoder) {
    bind(renderPass);
    renderPass.setVertexBuffer(0, modelBuffer);
    renderPass.draw(geometry.vertexCount);
  }

  return { transform, pipeline, render, updateBuffers };
}
