import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import {
  createVertexBuffer,
  createIndexBuffer,
  getBufferOffsets,
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

  const worldWgsl = /* wgsl */ `
    const texWidth = ${texture.width};
    const texHeight = ${texture.height};

    struct WorldMapUniforms {
      width: f32,
      height: f32,
      seed: f32,
      scale: f32,
      x: f32,
      y: f32,
      z: f32,
      zoom: f32
    };

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) normal: vec3f,
    }

    struct CameraUniforms {
      transform: mat4x4f
    };

    struct WorldPoint {
      height: f32,
      temperature: f32,
      moisture: f32,
      iciness: f32,
      desert: f32,
      seaLevel: f32,
      _pad1: f32,
      _pad2: f32,
      color: vec4f
    };

    @group(0) @binding(0)
    var<uniform> worldMapUniforms: WorldMapUniforms;

    @group(1) @binding(0) 
    var<uniform> cameraUniforms: CameraUniforms;

    @group(2) @binding(0) 
    var<storage> textureData: array<WorldPoint>; 

    @vertex
    fn vertexMain(
      @location(0) position: vec4f,
      @location(1) uv: vec2f
    ) -> VertexOutput {
      let index = u32(uv.y * texHeight - 1) * texWidth + u32(uv.x * texWidth - 1);
      let worldPoint = textureData[index];
      let worldPointA = textureData[index + 1]; 
      let worldPointB = textureData[index + texWidth]; 

      var diffDist = worldMapUniforms.zoom / 20.0;
      var toA = normalize(vec3(diffDist, 0.0, (worldPointA.height - worldPoint.height)));
      var toB = normalize(vec3(0.0, diffDist, (worldPointB.height - worldPoint.height)));
      
      var output: VertexOutput;
      output.normal = normalize(cross(toA, toB));

      var height = worldPoint.height; 
      let isSea = height < worldPoint.seaLevel;
      if (isSea) {
        height = worldPoint.seaLevel;
        output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z * 4));
      }

      output.position = cameraUniforms.transform * (position + vec4f(0.0, 0.0, (height - worldPoint.seaLevel) / worldMapUniforms.zoom * 5, 0.0));
      output.uv = uv;
      output.color = worldPoint.color;
      return output;
    }

    @fragment
    fn fragMain(
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) normal: vec3f,
    ) -> @location(0) vec4f {
      let index = u32(uv.y * texHeight) * texWidth + u32(uv.x * texWidth);
      let worldPoint = textureData[index];

      let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
      let lightIntensity: f32 = dot(normal, lightDir);
      let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);

      return vec4<f32>(worldPoint.color.rgb * intensity, 1.0);            
    }
  `;

  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: worldWgsl,
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
        code: worldWgsl,
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

  const offsets = getBufferOffsets(getWorldMapUniforms, getTransformMatrix);
  const [worldMapUniforms, cameraUniforms] = offsets;
  const uniformBufferSize = cameraUniforms.end;

  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const worldMapBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: worldMapUniforms.offset,
          size: worldMapUniforms.size,
        },
      },
    ],
  });

  const planeMatrixBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: cameraUniforms.offset,
          size: cameraUniforms.size,
        },
      },
    ],
  });

  const computeForRenderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(2),
    entries: [
      {
        binding: 0,
        resource: {
          offset: 0,
          buffer: texture.buffer,
        },
      },
    ],
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
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32");
    renderPass.setBindGroup(0, worldMapBindGroup);
    renderPass.setBindGroup(1, planeMatrixBindGroup);
    renderPass.setBindGroup(2, computeForRenderBindGroup);
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);
  }

  return {
    transform,
    pipeline: renderPipeline,
    render,
    updateBuffers,
  };
}
