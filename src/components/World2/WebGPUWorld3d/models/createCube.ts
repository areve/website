import createCubeVertWgsl from "./createCube.vert.wgsl";
import createCubeFragWgsl from "./createCube.frag.wgsl";
import { vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometries/cube";
import { createRenderPipelineBuilder, createVertexBuffer } from "../lib/buffer";
import { applyCamera, Camera } from "../lib/camera";

export function createCube(
  device: GPUDevice,
  getWorldMapParams: () => Float32Array,
  getCamera: () => Camera
) {
  const geometry = createCubeGeometry("cube");

  const transform = {
    translation: vec3.create(0, 0, 4),
    rotation: vec3.create(0, 0, 0),
  };
  const getTransformMatrix = () =>
    applyCamera(transform.translation, transform.rotation, getCamera());

  const { draw, updateBuffers } = createRenderPipelineBuilder(device)
    .createUniformBuffer(getWorldMapParams, getTransformMatrix)
    .setGeometry(geometry)
    .setVertexModule(createCubeVertWgsl)
    .setFragmentModule(createCubeFragWgsl)
    .create();

  return { transform, render: draw, updateBuffers };
}
