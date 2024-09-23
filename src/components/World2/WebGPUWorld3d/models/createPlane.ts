import { vec3 } from "wgpu-matrix";
import { createPlaneGeometry } from "../geometries/plane";
import { applyCamera, Camera } from "../lib/camera";
import { createVertexBuffer, createIndexBuffer } from "../lib/buffer";

export function createPlane(
  device: GPUDevice,
  getWorldMapUniforms: () => Float32Array,
  getCamera: () => Camera,
  textureStorageBuffer: GPUBuffer
) {
  const geometry = createPlaneGeometry("plane", 10, 10, 500, 500);
  const vertexBuffer = createVertexBuffer(device, geometry);
  const indexBuffer = createIndexBuffer(device, geometry);

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
      desert: f32,
      seaLevel: f32
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
      let index = u32(uv.y * 500) * 500+ u32(uv.x * 500);
      let worldPoint = textureData[index];
      let diffDist = 0.1;
      let worldPointA = textureData[index + u32(200 * diffDist / uniforms.zoom)]; // TODO could be out of range and cause world wrap?
      let worldPointB = textureData[index + u32(200 * 500 * diffDist / uniforms.zoom)]; // TODO could be out of range and cause crash?

      var offset = 0.1;
      var toA = normalize(vec3(diffDist, 0.0, worldPointA.height - worldPoint.height));
      var toB = normalize(vec3(0.0, diffDist, worldPointA.height - worldPoint.height));
      
      var output: VertexOutput;
      output.normal = normalize(cross(toA, toB));

      var height = worldPoint.height; 
      let isSea = height < worldPoint.seaLevel;
      if (isSea) {
        height = worldPoint.seaLevel;
        output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z * 4));
      }

      ///(height - seaLevel) / uniforms.zoom * 5
      output.position = uniforms2.transform * (position + vec4f(0.0, 0.0, (height - worldPoint.seaLevel) / uniforms.zoom * 5, 0.0));
      output.uv = uv;
      output.color = vec4f(worldPoint.height, 1.0, 0.0, 1.0);
      return output;
    }

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

    @fragment
    fn fragMain(
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) face: vec2f,
      @location(3) normal: vec3f,
    ) -> @location(0) vec4f {
      let index = u32(uv.y * 500) * 500+ u32(uv.x * 500);
      let worldPoint = textureData[index];

      let m = worldPoint.moisture;
      let t = worldPoint.temperature;
      let i = worldPoint.iciness;
      let d = worldPoint.desert;
      let height = worldPoint.height;
      let seaLevel = worldPoint.seaLevel;

      let isSea = height < worldPoint.seaLevel;


      let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
      let lightIntensity: f32 = dot(normal, lightDir);
      let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);

      if(isSea) {
        let seaDepth = c(1 - height / seaLevel);
        let sd = seaDepth;
        let seaHsv = vec3f(
          229.0 / 360.0,
          0.47 + sd * 0.242 - 0.1 + t * 0.2,
          0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
        );
        return vec4<f32>(hsv2rgb(vec3f(
          seaHsv[0],
          c(seaHsv[1] - 0.2 * i),
          c(seaHsv[2] + 0.2 * i)
        )) * intensity, 1.0);
      } else {
        let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
        let sh = heightAboveSeaLevel;
    
        let landHsv = vec3f(
          77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
          0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
          0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
        );

        return vec4<f32>(hsv2rgb(vec3f(
          landHsv[0] - d * 0.1,
          c(landHsv[1] - 0.3 * i + d * 0.1),
          c(landHsv[2] + 0.6 * i + d * 0.45),
        )) * intensity, 1.0);            
      }
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
            {
              // faceCoord
              shaderLocation: 2,
              offset: geometry.faceCoordOffset,
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

function getSizeFor(buffers: Float32Array[]) {
  return buffers.reduce(
    (acc, buffer) => acc + Math.ceil(buffer.byteLength / 256) * 256,
    0
  );
}
