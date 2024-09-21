import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import {
  createVertexBuffer,
  createUniformBuffer,
  createIndexBuffer,
} from "../lib/buffer";

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
    translation: vec3.create(-5, -5, 0),
    rotation: vec3.create(0, 0, 0),
  };

  const computeWgsl = /* wgsl */ `
  @group(0) @binding(0) 
  var<storage, read_write> textureData: array<u32>; 

  const IMAGE_WIDTH = 1024;
  const IMAGE_HEIGHT = 1024;
  @compute @workgroup_size(16, 16)
  fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
      let x = f32(global_id.x) / f32(IMAGE_WIDTH);
      let y = f32(global_id.y) / f32(IMAGE_HEIGHT);

      // Scale to Mandelbrot set range
      let c = vec2<f32>(x * 3.5 - 2.5, y * 2.0 - 1.0);

      var z = vec2<f32>(0.0, 0.0);
      var iter = 0u;
      let maxIter = 255u;

      // Mandelbrot iteration loop
      while (iter < maxIter && dot(z, z) < 4.0) {
          z = vec2<f32>(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
          iter = iter + 1u;
      }

      let index = global_id.y * IMAGE_WIDTH + global_id.x;
      textureData[index] = 255;
  }
  `;

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
    var<storage, read_write> textureData: array<u32>; 


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
        output.color = vec4f(fract(coord.xy), 0.5, 1.0);
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
        let foo = textureData[u32(color.r * 10)];
        return vec4f(color.rg, f32(foo) / 255.0, 0.0);
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
        binding: 2, // This corresponds to the `textureData` buffer in the compute shader
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }, // Indicates a storage buffer
      },
    ],
  });

  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: worldWgsl,
      }),
      buffers: [layout],
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

  const width = 1024;
  const height = 1024;

  // Create the storage buffer for the fractal data
  const storageBuffer = device.createBuffer({
    size: width * height * 4, // One u32 per pixel
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
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

  const computeForRenderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(2),
    entries: [
      {
        binding: 0, 
        resource: { 
          offset: 4096,
          buffer: storageBuffer 
        }, 
      },
    ],
  });
  // const buffers = createUniformBuffer(device, renderPipeline, {
  //   worldMapUniforms: {
  //     layout: 0,
  //     getBuffer: getWorldMapUniforms,
  //   },
  //   planeMatrix: {
  //     layout: 1,
  //     getBuffer: () =>
  //       applyCamera(transform.translation, transform.rotation, getCamera()),
  //   }
  // });

  // const buffers: Float32Array[] = [];
  // for (const key in bufferInfo) {
  //   if (bufferInfo.hasOwnProperty(key)) {
  //     const b = bufferInfo[key] as {
  //       layout: number;
  //       getBuffer: () => Float32Array;
  //     };
  //     buffers.push(b.getBuffer());
  //   }
  // }

  // const uniformBuffer = {
  //   uniformBuffer: device.createBuffer({
  //     size: getSizeFor(buffers),
  //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  //   }),
  //   offset: 0,
  // };

  // const result = {} as {
  //   [K in keyof T]: {
  //     bindGroup: GPUBindGroup;
  //     getBuffer: () => Float32Array;
  //     buffer: GPUBuffer;
  //     offset: number;
  //   };
  // };

  // for (const key in bufferInfo) {
  //   if (bufferInfo.hasOwnProperty(key)) {
  //     const b = bufferInfo[key] as {
  //       layout: number;
  //       getBuffer: () => Float32Array;
  //     };
  //     result[key] = createBuffer(
  //       device,
  //       uniformBuffer,
  //       pipeline.getBindGroupLayout(b.layout), // TODO pipeline1?
  //       b.getBuffer
  //     );
  //   }
  // }

  // // console.log(computePipeline.getBindGroupLayout(0))
  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0, // Corresponds to the buffer binding in the compute shader
        resource: { buffer: storageBuffer }, // The buffer to store fractal data
      },
    ],
  });

  // const bindGroup = device.createBindGroup({
  //   layout: renderPipeline.getBindGroupLayout(0),
  //   entries: [
  //     {
  //       binding: 0,
  //       resource: {
  //         buffer: storageBuffer,
  //       },
  //     },
  //   ],
  // });

  function updateBuffers() {
    // for (const [_, v] of Object.entries(buffers)) {
    // device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
    // }
    device.queue.writeBuffer(uniformBuffer, 0, getWorldMapUniforms());
    device.queue.writeBuffer(
      uniformBuffer,
      1024,
      applyCamera(transform.translation, transform.rotation, getCamera())
    );
    // computeBindGroup
  }

  function compute(computePass: GPUComputePassEncoder) {
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    // renderPass.setBindGroup(2, buffers.planeMatrix.bindGroup);
    // renderPass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16));
    //  // Set up the compute pass
    //  const computePassEncoder = commandEncoder.beginComputePass();
    //  computePassEncoder.setPipeline(computePipeline);
    // computePass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    // computePass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    const width = 1024;
    const height = 1024;
    computePass.dispatchWorkgroups(
      Math.ceil(width / 16),
      Math.ceil(height / 16)
    );
    // computePass.end();
    // console.log('compute')
    //  computePassEncoder.end();
    // device.queue.submit([commandEncoder.finish()]);
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
