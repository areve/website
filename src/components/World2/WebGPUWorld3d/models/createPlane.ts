import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import { createVertexBuffer, createIndexBuffer } from "../lib/buffer";

export function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera
) {
  const geometry = createPlaneGeometry("plane", 10, 10, 500, 500);
  const vertexBuffer = createVertexBuffer(device, geometry);
  const indexBuffer = createIndexBuffer(device, geometry);
  const vertexBufferLayout: GPUVertexBufferLayout = {
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
    translation: vec3.create(-5, -5, 0),
    rotation: vec3.create(0, 0, 0),
  };

  const worldWgsl = /* wgsl */ `
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

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) face: vec2f,
      @location(3) normal: vec3f,
    }

    struct Uniforms2 {
      transform: mat4x4f
    };

    @group(0) @binding(0)
    var<uniform> uniforms: Uniforms;

    @group(1) @binding(0) 
    var<uniform> uniforms2: Uniforms2;

    @group(2) @binding(0) 
    var<storage, read_write> textureData: array<f32>; 


    const IMAGE_WIDTH = 1024;
    const IMAGE_HEIGHT = 1024;

    @vertex
    fn vertexMain(
        @location(0) position: vec4f,
        @location(1) uv: vec2f,
        @location(2) face: vec2f,
    ) -> VertexOutput {
        var dummy = uniforms.scale;
        var dummy2 = uniforms2.transform;
        let coord = vec3f(
          uv.x * 16 + uniforms.x / 16,
          uv.y * 16 - uniforms.y / 16,
          0.0
        );
        var output: VertexOutput;
        output.position = uniforms2.transform * position;
        output.uv = uv;

        output.color = vec4f(1.0, 1.0, 0.0, 1.0);
        return output;
    }

    @fragment
    fn fragMain(
        @location(0) uv: vec2f,
        @location(1) color: vec4f,
        @location(2) face: vec2f,
        @location(3) normal: vec3f,
    ) -> @location(0) vec4f {
        let dummy = uniforms.seed;
        let index = i32(uv.y * 16.0 + uv.x);
        let foo = textureData[index];
        return vec4f(foo, 0.5, color.b, 0.0);
    }
  `;

  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: worldWgsl,
      }),
      buffers: [vertexBufferLayout],
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

  const uniformBuffer = device.createBuffer({
    // size: getSizeFor(buffers),
    size: 1024 * 48,
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

  const planeMatrixBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 1024,
          size: applyCamera(
            transform.translation,
            transform.rotation,
            getCamera()
          ).byteLength,
        },
      },
    ],
  });

  const computeWgsl = /* wgsl */ `
    @group(0) @binding(0) 
    var<storage, read_write> textureData: array<f32>; 

    const IMAGE_WIDTH = 1024;
    const IMAGE_HEIGHT = 1024;
    @compute @workgroup_size(16, 16)
    fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let x = f32(global_id.x) / 16.0;
        let y = f32(global_id.y) / 16.0;

        let index = global_id.y * 16 + global_id.x;
        textureData[index] = f32((global_id.y + global_id.x) % 2);
    }
  `;

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({
        code: computeWgsl,
      }),
      entryPoint: "computeMain",
    },
  });

  const computeTextureBuffer = device.createBindGroupLayout({
    entries: [
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });

  const textureStorageBuffer = device.createBuffer({
    size: 1024 * 1024 * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  const textureReadBackBuffer = device.createBuffer({
    size: textureStorageBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: textureStorageBuffer },
      },
    ],
  });

  const computeForRenderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(2),
    entries: [
      {
        binding: 0,
        resource: {
          offset: 4096,
          buffer: textureStorageBuffer,
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

  async function compute(
    computePass: GPUComputePassEncoder,
    encoder: GPUCommandEncoder
  ) {
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(16, 16);
    computePass.end();

    encoder.copyBufferToBuffer(
      textureStorageBuffer,
      0,
      textureReadBackBuffer,
      0,
      textureStorageBuffer.size
    );

    device.queue.submit([encoder.finish()]);

    await textureReadBackBuffer.mapAsync(GPUMapMode.READ);

    const bufferView = new Float32Array(textureReadBackBuffer.getMappedRange());
    console.log("bufferView", bufferView.slice(0, 16).toString());
    textureReadBackBuffer.unmap();
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32"); // Or 'uint16' if using smaller indices
    renderPass.setBindGroup(0, worldMapBindGroup);
    renderPass.setBindGroup(1, planeMatrixBindGroup);
    renderPass.setBindGroup(2, computeForRenderBindGroup);
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);
  }

  return {
    transform,
    pipeline: renderPipeline,
    // buffers,
    render,
    compute,
    updateBuffers,
  };
}

function getSizeFor(buffers: Float32Array[]) {
  return buffers.reduce(
    (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
    0
  );
}
