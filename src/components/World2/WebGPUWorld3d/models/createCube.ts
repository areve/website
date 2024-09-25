import createCubeVertWgsl from "./createCube.vert";
import createCubeFragWgsl from "./createCube.frag";
import { vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometries/cube";
import {
  CodeInfo,
  createLayoutBuilder,
  createVertexBuffer,
  getBufferOffsets,
} from "../lib/buffer";
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

  const offsets = getBufferOffsets(getWorldMapUniforms, getTransformMatrix);
  const [worldMapUniforms, cameraUniforms] = offsets;
  const uniformBufferSize = cameraUniforms.end;

  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const {
    layout,
    bindGroups: [worldMapBindGroup, cubeMatrixBindGroup],
  } = createLayoutBuilder(device, "render")
    .addBuffer({
      buffer: uniformBuffer,
      offset: worldMapUniforms.offset,
      size: worldMapUniforms.size,
      type: "uniform",
    })
    .addBuffer({
      buffer: uniformBuffer,
      offset: cameraUniforms.offset,
      size: cameraUniforms.size,
      type: "uniform",
    })
    .create();

  const { pipeline } = createRenderPipelineBuilder(device)
    .setVertexModule({
      entryPoint: "",
      code: createCubeVertWgsl,
    })
    .setFragmentModule({
      entryPoint: "",
      code: createCubeFragWgsl,
    })
    .create();

  const renderPipeline = device.createRenderPipeline({
    label: "blah pipeline",
    layout,
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: createCubeVertWgsl,
      }),
      buffers: [
        {
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
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: createCubeFragWgsl,
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

  function updateBuffers() {
    device.queue.writeBuffer(
      uniformBuffer,
      worldMapUniforms.offset,
      worldMapUniforms.getBuffer()
    );
    device.queue.writeBuffer(
      uniformBuffer,
      cameraUniforms.offset,
      cameraUniforms.getBuffer()
    );
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, modelBuffer);
    renderPass.setBindGroup(0, worldMapBindGroup);
    renderPass.setBindGroup(1, cubeMatrixBindGroup);
    renderPass.draw(geometry.vertexCount);
  }

  return { transform, pipeline: renderPipeline, render, updateBuffers };
}

function createRenderPipelineBuilder(device: GPUDevice) {
  const modules: CodeInfo[] = [];

  const builder = {
    setVertexModule(codeInfo: CodeInfo) {
      modules.push(codeInfo);
      return builder;
    },
    setFragmentModule(codeInfo: CodeInfo) {
      modules.push(codeInfo);
      return builder;
    },
    create() {
      return {
        pipeline: {},
      };
    },
  };

  return builder;
}
