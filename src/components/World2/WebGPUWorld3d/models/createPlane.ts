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
    var<storage> textureData: array<vec4f>; 

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

        let index = u32(uv.y * 500) * 500+ u32(uv.x * 500);
        let foo = textureData[index];

        var output: VertexOutput;
        output.position = uniforms2.transform * (position + vec4f(0.0, 0.0, foo.z, 0.0));
        output.uv = uv;
        output.color = vec4f(foo.x, 1.0, 0.0, 1.0);
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
        let index = u32(uv.y * 500) * 500+ u32(uv.x * 500);
        let foo = textureData[index];
        return vec4f(color.x, foo.y, foo.z, 1.0);
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

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({
        code: /* wgsl */ `
          @group(0) @binding(0) 
          var<storage, read_write> textureData: array<vec4f>; 
      
          fn noise(seed: f32, coord: vec4<f32>) -> f32 {
            let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
            let m: u32 = (n ^ (n >> 13)) * 1274126177;
            return f32(m) / f32(0xffffffff);
          }
    
          const skew3d: f32 = 1.0 / 3.0;
          const unskew3d: f32 = 1.0 / 6.0;
          const rSquared3d: f32 = 3.0 / 4.0;

          fn openSimplex3d(seed: f32, x: f32, y: f32, z: f32) -> f32 {
              let sx: f32 = x;
              let sy: f32 = y;
              let sz: f32 = z;
              let skew: f32 = (sx + sy + sz) * skew3d;
              let ix: i32 = i32(floor(sx + skew));
              let iy: i32 = i32(floor(sy + skew));
              let iz: i32 = i32(floor(sz + skew));
              let fx: f32 = sx + skew - f32(ix);
              let fy: f32 = sy + skew - f32(iy);
              let fz: f32 = sz + skew - f32(iz);

              return 0.5 + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
          }

          fn vertexContribution(
              seed: f32,
              ix: i32, iy: i32, iz: i32,
              fx: f32, fy: f32, fz: f32,
              cx: i32, cy: i32, cz: i32
          ) -> f32 {
              let dx: f32 = fx - f32(cx);
              let dy: f32 = fy - f32(cy);
              let dz: f32 = fz - f32(cz);
              let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
              let dxs: f32 = dx - skewedOffset;
              let dys: f32 = dy - skewedOffset;
              let dzs: f32 = dz - skewedOffset;

              let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
              if a < 0.0 {
                  return 0.0;
              }

              let h: i32 = bitcast<i32>(noise(seed, vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
              let u: i32 = (h & 0xf) - 8;
              let v: i32 = ((h >> 4) & 0xf) - 8;
              let w: i32 = ((h >> 8) & 0xf) - 8;
              return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
          }

          @compute @workgroup_size(16, 16)
          fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
              let x = global_id.x;
              let y = global_id.y;
              let index = y * 500u + x;
              if (x < 500u && y < 500u) {
                let index = y * 500u + x;
                
                let n = openSimplex3d(12345.0, f32(x) / 64.0, f32(y) / 64.0, 0.0);
                textureData[index] = vec4f(
                  n,
                  n,//f32(y) / 500.0,
                  n, //0.5,
                  1.0
                );
  
              }
          }
        `,
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
    size: 1000 * 1000 * 4,
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
          offset: 0,
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

  async function compute(device: GPUDevice) {
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    const workgroupSize = { x: 16, y: 16 };
    computePass.dispatchWorkgroups(
      Math.ceil(500 / workgroupSize.x),
      Math.ceil(500 / workgroupSize.y)
    );
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
    // console.log(
    //   "bufferView",
    //   bufferView.slice(0, 16).toString(),
    //   "#",
    //   bufferView.slice(4 * 496, 4 * 496 + 16).toString()
    // );
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
