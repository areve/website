import { getBufferOffsets } from "../lib/buffer";

export function createWorldData(
  device: GPUDevice,
  width: number,
  height: number,
  getWorldMapUniforms: () => ArrayBufferLike
) {
  const storageBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });

  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform",
        },
      },
    ],
  });

  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [storageBindGroupLayout, uniformBindGroupLayout],
    }),
    compute: {
      module: device.createShaderModule({
        code: /* wgsl */ `
          struct WorldPoint {
            height: f32,
            temperature: f32,
            moisture: f32,
            iciness: f32,
            desert: f32,
            seaLevel: f32,
            _pad1: f32, // because vec4f wants is aligned to 16byte
            _pad2: f32, // because vec4f wants is aligned to 16byte
            color: vec4f
          };
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
      
          @group(0) @binding(0) 
          var<storage, read_write> textureData: array<WorldPoint>; 
      
          @group(1) @binding(0)
          var<uniform> worldMapUniforms: WorldMapUniforms;

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
    
          fn noise(seed: f32, coord: vec4f) -> f32 {
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

          fn fractalNoise(seed: f32, x: f32, y: f32, z: f32, numLayers: u32) -> f32 {
            var total: f32 = 0.0;
            var amplitude: f32 = 1.0;
            var frequency: f32 = 1.0;
            var maxAmplitude: f32 = 0.0;
        
            for (var i: u32 = 0; i < numLayers; i++) {
              let noise = openSimplex3d(
                seed * f32(i * 10000 + 12345),
                x * (frequency), y * (frequency), z * (frequency));
      
              total += noise * amplitude;
              maxAmplitude += amplitude;
      
              amplitude *= 0.25;
              frequency *= 4.0;
            }
        
            return total / maxAmplitude;
          }

          @compute @workgroup_size(16, 16)
          fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            let index = y * ${width}u + x ;
            if (x < ${width}u && y < ${height}u) {
              let index = y * ${height}u + x;
              
              let wx = f32(x) * worldMapUniforms.zoom + worldMapUniforms.x;
              let wy =  worldMapUniforms.height - f32(y) * worldMapUniforms.zoom + worldMapUniforms.y;
              var worldPoint: WorldPoint;
              worldPoint.height = fractalNoise(worldMapUniforms.seed, f32(wx) / 128, f32(wy) / 128, 0.0, 4); 
              worldPoint.temperature = fractalNoise(worldMapUniforms.seed * 712345, f32(wx) / 256, f32(wy) / 256, 0.0, 2); 
              worldPoint.moisture = fractalNoise(worldMapUniforms.seed * 812345, f32(wx) / 512, f32(wy) / 512, 0.0, 2); 
              worldPoint.iciness = c(heightIcinessCurve(worldPoint.height) + temperatureIcinessCurve(worldPoint.temperature));
              worldPoint.desert = c(moistureDesertCurve(worldPoint.moisture) + temperatureDesertCurve(worldPoint.temperature));
              worldPoint.seaLevel = 0.55;

              // use other computation to come up with better color, this is just for debugging 
              worldPoint.color = vec4f(
                worldPoint.height, worldPoint.temperature, worldPoint.moisture, 1.0);

              textureData[index] = worldPoint;
            }
          }
        `,
      }),
      entryPoint: "computeMain",
    },
  });

  const offsets = getBufferOffsets(getWorldMapUniforms);
  const [worldMapUniforms] = offsets;
  const uniformBufferSize = worldMapUniforms.end;

  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const computeWorldMapBindGroup = device.createBindGroup({
    layout: uniformBindGroupLayout,
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

  const worldPointByteSize = 12 * 4;
  const textureStorageBuffer = device.createBuffer({
    size: width * height * worldPointByteSize,
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
    layout: storageBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: textureStorageBuffer },
      },
    ],
  });

  async function compute(device: GPUDevice) {
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.setBindGroup(1, computeWorldMapBindGroup);
    const workgroupSize = { x: 16, y: 16 };
    computePass.dispatchWorkgroups(
      Math.ceil(width / workgroupSize.x),
      Math.ceil(height / workgroupSize.y)
    );
    computePass.end();

    const debug = false;
    if (debug) {
      encoder.copyBufferToBuffer(
        textureStorageBuffer,
        0,
        textureReadBackBuffer,
        0,
        textureStorageBuffer.size
      );

      await textureReadBackBuffer.mapAsync(GPUMapMode.READ);

      const bufferView = new Float32Array(
        textureReadBackBuffer.getMappedRange()
      );
      console.log(
        "bufferView",
        bufferView.slice(0, 24).toString(),
        "#",
        bufferView.slice(4 * 496, 4 * 496 + 24).toString()
      );
      textureReadBackBuffer.unmap();
    }
    device.queue.submit([encoder.finish()]);
  }

  function updateBuffers() {
    device.queue.writeBuffer(
      uniformBuffer,
      worldMapUniforms.offset,
      worldMapUniforms.getBuffer()
    );
  }

  return {
    compute,
    updateBuffers,
    buffer: textureStorageBuffer,
    width,
    height,
  };
}
