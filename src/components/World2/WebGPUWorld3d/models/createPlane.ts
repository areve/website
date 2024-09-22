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

    struct WorldPoint {
      height: f32,
      temperature: f32,
      moisture: f32,
      iciness: f32,
      desert: f32
    };

    @group(0) @binding(0)
    var<uniform> uniforms: Uniforms;

    @group(1) @binding(0) 
    var<uniform> uniforms2: Uniforms2;

    @group(2) @binding(0) 
    var<storage> textureData: array<WorldPoint>; 

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
        let worldPoint = textureData[index];

        var output: VertexOutput;
        output.position = uniforms2.transform * (position + vec4f(0.0, 0.0, worldPoint.height, 0.0));
        output.uv = uv;
        output.color = vec4f(worldPoint.height, 1.0, 0.0, 1.0);
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
        let worldPoint = textureData[index];
        return vec4f(color.x, worldPoint.temperature, worldPoint.moisture, 1.0);
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
          // let height = worldPointHeight(f32(x), f32(y), 0.0);
          // let temperature = worldPointTemperature(f32(x), f32(y), 0.0);
          // let moisture = worldPointMoisture(f32(x), f32(y), 0.0);

          // let iciness = c(heightIcinessCurve(height) + temperatureIcinessCurve(temperature));
          // let desert = c(moistureDesertCurve(moisture) + temperatureDesertCurve(temperature));

          struct WorldPoint {
            height: f32,
            temperature: f32,
            moisture: f32,
            iciness: f32,
            desert: f32
          };
    
          @group(0) @binding(0) 
          var<storage, read_write> textureData: array<WorldPoint>; 
      
          fn clamp(value: f32, low: f32, high: f32) -> f32 {
            return min(max(value, low), high);
          }
      
          fn c(v: f32) -> f32 {
            return clamp(v, 0, 1);
          }

          fn piecewiseCurve(t: f32, p: f32, s: f32) -> f32 {
            var c: f32;
            if s == 3.0 {
                c = 1e10;
            } else {
                c = (1.0 - s) / (s - 3.0);
            }
    
            if t < p {
              let n = t * (1.0 + c);
              let d = t + p * c;
              let r = n / d;
              return t * r * r;
            } else {
              let v = 1.0 - t;
              let n = v * (1.0 + c);
              let d = v + (1.0 - p) * c;
              let r = n / d;
              return 1.0 - v * r * r;
            }
          }

          fn heightIcinessCurve(t: f32) -> f32 {
            return piecewiseCurve(t, 0.8, 15.0);
          }
                    
          fn temperatureIcinessCurve(t: f32) -> f32 {
            return 1 - piecewiseCurve(t, 0.3, 6.0);
          }
      
          fn moistureDesertCurve(t: f32) -> f32 {
            return 1 - piecewiseCurve(t, 0.3, 10.0);
          }
                    
          fn temperatureDesertCurve(t: f32) -> f32 {
            return piecewiseCurve(t, 0.7, 8.0);
          }
    
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

          fn worldPointHeight(x: f32, y:f32, z:f32) -> f32 {
            let height1 = openSimplex3d(12345 * 112345, x / 129, y / 129, z / 129);
            let height2 = openSimplex3d(12345 * 212345, x / 47, y / 47, z / 47);
            let height3 = openSimplex3d(12345 * 312345, x / 7, y / 7, z / 7);
            let height4 = openSimplex3d(12345 * 412345, x / 1, y / 1, z / 1);
            return 0.6 * height1 + 0.3 * height2 + 0.15 * height3 + 0.05 * height4;
          }

          fn worldPointTemperature(x: f32, y:f32, z:f32) -> f32 {
            let temperature1 = openSimplex3d(12345 * 512345, x / 71, y / 71, z / 71);
            let temperature2 = openSimplex3d(12345 * 612345, x / 15, y / 15, z / 15);
            return 0.7 * temperature1 + 0.3 * temperature2;
          }
      
          fn worldPointMoisture(x: f32, y:f32, z:f32) -> f32 {
            let moisture1 = openSimplex3d(12345 * 712345, x / 67, y / 67, z / 67);
            let moisture2 = openSimplex3d(12345 * 812345, x / 13, y / 13, z / 13);
            return 0.7 * moisture1 + 0.3 * moisture2;
          }

          @compute @workgroup_size(16, 16)
          fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            let index = y * 500u + x;
            if (x < 500u && y < 500u) {
              let index = y * 500u + x;
              
              var worldPoint: WorldPoint;
              worldPoint.height = worldPointHeight(f32(x), f32(y), 0.0);
              worldPoint.temperature = worldPointTemperature(f32(x), f32(y), 0.0);
              worldPoint.moisture = worldPointMoisture(f32(x), f32(y), 0.0);

              worldPoint.iciness = c(heightIcinessCurve(worldPoint.height) + temperatureIcinessCurve(worldPoint.temperature));
              worldPoint.desert = c(moistureDesertCurve(worldPoint.moisture) + temperatureDesertCurve(worldPoint.temperature));

              textureData[index] = worldPoint;
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

    // encoder.copyBufferToBuffer(
    //   textureStorageBuffer,
    //   0,
    //   textureReadBackBuffer,
    //   0,
    //   textureStorageBuffer.size
    // );

    device.queue.submit([encoder.finish()]);

    // await textureReadBackBuffer.mapAsync(GPUMapMode.READ);

    // const bufferView = new Float32Array(textureReadBackBuffer.getMappedRange());
    // // console.log(
    // //   "bufferView",
    // //   bufferView.slice(0, 16).toString(),
    // //   "#",
    // //   bufferView.slice(4 * 496, 4 * 496 + 16).toString()
    // // );
    // textureReadBackBuffer.unmap();
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
