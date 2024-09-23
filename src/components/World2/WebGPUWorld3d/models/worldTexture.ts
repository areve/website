import { getBufferOffsets } from "../lib/buffer";

export function createWorldTexture(
  device: GPUDevice,
  data: {
    buffer: GPUBuffer;
    width: number;
    height: number;
  },
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
          const dataWidth: u32 = ${data.width};
          const dataHeight: u32 = ${data.height};
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

          fn hsv2rgb(hsv: vec3f) -> vec3f {
            let h = hsv.x;
            let s = hsv.y;
            let v = hsv.z;
            let hue = (((h * 360) % 360) + 360) % 360;
            let sector = floor(hue / 60);
            let sectorFloat = hue / 60 - sector;
            let x = v * (1 - s);
            let y = v * (1 - s * sectorFloat);
            let z = v * (1 - s * (1 - sectorFloat));
            let rgb = array<f32, 10>(x, x, z, v, v, y, x, x, z, v);
      
            return vec3f(rgb[u32(sector) + 4], rgb[u32(sector) + 2], rgb[u32(sector)]);
          }

          fn getWorldPointColor(worldPoint: WorldPoint) -> vec4f {
            let m = worldPoint.moisture;
            let t = worldPoint.temperature;
            let i = worldPoint.iciness;
            let d = worldPoint.desert;
            let height = worldPoint.height;
            let seaLevel = worldPoint.seaLevel;
      
            let isSea = height < worldPoint.seaLevel;
            
            if(isSea) {
              let seaDepth = c(1 - height / seaLevel);
              let sd = seaDepth;
              let seaHsv = vec3f(
                229.0 / 360.0,
                0.47 + sd * 0.242 - 0.1 + t * 0.2,
                0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
              );
              return vec4f(hsv2rgb(vec3f(
                seaHsv[0],
                c(seaHsv[1] - 0.2 * i),
                c(seaHsv[2] + 0.2 * i)
              )), 1.0);
            } else {
              let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
              let sh = heightAboveSeaLevel;
          
              let landHsv = vec3f(
                77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
                0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
                0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
              );
      
              return vec4f(hsv2rgb(vec3f(
                landHsv[0] - d * 0.1,
                c(landHsv[1] - 0.3 * i + d * 0.1),
                c(landHsv[2] + 0.6 * i + d * 0.45),
              )), 1.0);            
            }
          }

          @compute @workgroup_size(16, 16)
          fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            let index = y * dataWidth + x ;
            if (x < dataWidth && y < dataHeight) {
              let index = y * dataHeight + x;
              textureData[index].color = getWorldPointColor(textureData[index]);
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

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: data.buffer },
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
      Math.ceil(data.width / workgroupSize.x),
      Math.ceil(data.height / workgroupSize.y)
    );
    computePass.end();
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
    buffer: data.buffer,
    width: data.width,
    height: data.height,
  };
}
