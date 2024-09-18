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

    fn fractalHeight(x: f32, y: f32, z: f32, octaves: u32) -> f32 {
      var height: f32 = 0.0;
      var size = 1.0;
      var totalWeight: f32 = 0.0;
  
      for (var i: u32 = 0; i < octaves; i = i + 1) {
          var weight = pow(2.0, f32(i));  // Double the weight for each octave
          height = height + openSimplex3d(uniforms.seed * 112345 * f32(i), x / size, y / size, z / size) * weight;
          totalWeight = totalWeight + weight;  // Accumulate the total weight
          size = size * 2.0;  // Increase the size
      }
  
      // Normalize the height to ensure it's within 0 to 1
      height = height / totalWeight;
  
      return height;
  }
  

    fn worldPointHeight(x: f32, y:f32, z:f32) -> f32 {
        return fractalHeight(x, y, z, 12);
    }

    @vertex
    fn vertexMain(
        @location(0) position: vec4f,
        @location(1) uv: vec2f,
        @location(2) face: vec2f,
    ) -> VertexOutput {
        var output: VertexOutput;
        let scale = 50.0;
        let coord = vec4( (face.x + uv.x) * scale, (face.y + uv.y) * scale, 0.0, 0.0);

        let x = coord.x / uniforms.scale * uniforms.zoom + uniforms.x / uniforms.scale;
        let y = uniforms.height - coord.y / uniforms.scale * uniforms.zoom + uniforms.y / uniforms.scale;
        let z = uniforms.z;
        var height = worldPointHeight(x, y, z);

        var offset = 0.1;
        var pos = vec4(x, y, height, 0.0);
        let hA = worldPointHeight(x + 20.0, y, z);
        let hB = worldPointHeight(x, y + 20.0, z);
        var neighborA = vec4(x + 0.1, y, hA, 0.0);
        var neighborB = vec4(x, y + 0.1, hB, 0.0);
        var toA = normalize(neighborA.xyz - pos.xyz);
        var toB = normalize(neighborB.xyz - pos.xyz);
        output.normal = normalize(cross(toA, toB));
        output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z / 4.0));
        // output.normal = vec3(0.0, 1.0, 0.0);
        
        const seaLevel = 0.5;

        let isSea = height < seaLevel;
        if (isSea) {
          height = seaLevel;
          output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z * 4));
          output.color = vec4<f32>(height, height, 1.0, 1.0);
        } else {
          var hh = abs(fract(height * 20) * 2.0 - 1.0);
          output.color = vec4<f32>(hh, 1 - height / 2.0 , 0.0, 1.0);
        }

        output.position = uniforms2.transform * vec4f(position.xy, (height) / uniforms.zoom * 0.04, 1.0);
        output.uv = uv;
        output.face = face;
       
        return output;
    }


    @fragment
    fn fragMain(
        @location(0) uv: vec2f,
        @location(1) color: vec4f,
        @location(2) face: vec2f,
        @location(3) normal: vec3f,
    ) -> @location(0) vec4f {
        // z is top (at the moment, I think I will change this soon)
        let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
        let lightIntensity: f32 = dot(normal, lightDir);
        let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);
        return vec4f((color.rgb * intensity * 2 + color.rgb) / 3.0, 1.0);
    }
  `;

  const pipeline = device.createRenderPipeline({
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

  const buffers = createUniformBuffer(device, pipeline, {
    worldMapUniforms: {
      layout: 0,
      getBuffer: getWorldMapUniforms,
    },
    planeMatrix: {
      layout: 1,
      getBuffer: () =>
        applyCamera(transform.translation, transform.rotation, getCamera()),
    },
  });

  function updateBuffers() {
    for (const [_, v] of Object.entries(buffers)) {
      device.queue.writeBuffer(v.buffer, v.offset, v.getBuffer());
    }
  }

  function render(renderPass: GPURenderPassEncoder) {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32"); // Or 'uint16' if using smaller indices
    renderPass.setBindGroup(0, buffers.worldMapUniforms.bindGroup);
    renderPass.setBindGroup(1, buffers.planeMatrix.bindGroup);
    renderPass.drawIndexed(geometry.vertexCount, 1, 0, 0, 0);
  }

  return { transform, pipeline, buffers, render, updateBuffers };
}
