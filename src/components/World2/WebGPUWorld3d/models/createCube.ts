import { vec3 } from "wgpu-matrix";
import { createCubeGeometry } from "../geometries/cube";
import { createVertexBuffer } from "../lib/buffer";
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

  const renderPipeline = device.createRenderPipeline({
    label: "blah pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "blah vertex",
        code: /*wgsl*/ `
          struct VertexOutput {
            @builtin(position) Position: vec4f,
            @location(0) fragUV: vec2f,
            @location(1) fragPosition: vec4f,
          }

          struct Uniforms {
            transform: mat4x4f
          };

          @group(1) @binding(0) 
          var<uniform> uniforms: Uniforms;

          @vertex
          fn main(
            @location(0) position: vec4f,
            @location(1) uv: vec2f
          ) -> VertexOutput {
            var output: VertexOutput;
            output.Position = uniforms.transform * position;
            output.fragUV = uv;
            output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
            return output;
          }        
        `,
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
        code: /*wgsl*/ `
          struct Uniforms {
            width: f32,
            height: f32,
            seed: f32,
            scale: f32,
            x: f32,
            y: f32,
            z: f32,
            zoom: f32
          };

          @group(0) @binding(0)
          var<uniform> uniforms: Uniforms;

          @fragment
          fn main(
            @location(0) fragUV: vec2f,
            @location(1) fragPosition: vec4f
          ) -> @location(0) vec4f {
            let dummy = uniforms.seed;
            return vec4f(fragUV.xy, 0.0, 0.0);
          }
        `,
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

  const uniformBuffer = device.createBuffer({
    // size: getSizeFor(buffers),
    size: 1024 * 48, // TODO auto calc size
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const worldMapBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: getWorldMapUniforms().byteLength,
        },
      },
    ],
  });

  const cubeMatrixBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 1024, // TODO auto calc
          size: applyCamera(
            transform.translation,
            transform.rotation,
            getCamera()
          ).byteLength,
        },
      },
    ],
  });

  function updateBuffers() {
    device.queue.writeBuffer(uniformBuffer, 0, getWorldMapUniforms());
    device.queue.writeBuffer(
      uniformBuffer,
      1024,
      applyCamera(transform.translation, transform.rotation, getCamera())
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
