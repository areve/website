<template>
  <canvas ref="canvas" class="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
  {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
  {{ controller.zoom.toFixed(2) }}zoom
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "../lib/stats";
import { makeController } from "../lib/controller";
import { mat4, vec3 } from "wgpu-matrix";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const controller = makeController();
const width = 500;
const height = 500;
const seed = 12345;

let frameId: number = 0;
onMounted(async () => {
  controller.value.mount(canvas.value);
  const renderer = await setupWorldRenderer(canvas.value, {
    width,
    height,
    seed,
  });
  await renderer.init();
  const render = async (time: DOMHighResTimeStamp) => {
    await renderer.update(time, controller.value);
    controller.value.update();
    stats.value.update();
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  controller.value.unmount();
});

async function setupWorldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 8,
    width / height,
    1,
    100.0
  );

  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    modelViewProjectionMatrix: mat4.create(), // temp
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        ...new Float32Array(this.modelViewProjectionMatrix.buffer),
      ]);
    },
  };

  const sharedData2 = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    modelViewProjectionMatrix: mat4.create(), // temp
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        ...new Float32Array(this.modelViewProjectionMatrix.buffer),
      ]);
    },
  };

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const cubeVertexSize = 4 * 10; // Byte size of one cube vertex.
  const cubePositionOffset = 0;
  const cubeColorOffset = 4 * 4; // Byte offset of cube vertex color attribute.
  const cubeUVOffset = 4 * 8;
  const cubeVertexCount = 36;

  // prettier-ignore
  const cubeVertexArray = new Float32Array([
    // float4 position, float4 color, float2 uv,
    1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
    -1, -1, 1, 1,  0, 0, 1, 1,  1, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,
    1, -1, -1, 1,  1, 0, 0, 1,  0, 0,
    1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,

    1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
    1, -1, 1, 1,   1, 0, 1, 1,  1, 1,
    1, -1, -1, 1,  1, 0, 0, 1,  1, 0,
    1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
    1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
    1, -1, -1, 1,  1, 0, 0, 1,  1, 0,

    -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
    1, 1, 1, 1,    1, 1, 1, 1,  1, 1,
    1, 1, -1, 1,   1, 1, 0, 1,  1, 0,
    -1, 1, -1, 1,  0, 1, 0, 1,  0, 0,
    -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
    1, 1, -1, 1,   1, 1, 0, 1,  1, 0,

    -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
    -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
    -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
    -1, -1, -1, 1, 0, 0, 0, 1,  0, 0,
    -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
    -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,

    1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
    -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
    -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
    -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
    1, -1, 1, 1,   1, 0, 1, 1,  0, 0,
    1, 1, 1, 1,    1, 1, 1, 1,  0, 1,

    1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,  1, 1,
    -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
    1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
    1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
    -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
  ]);

  const verticesBuffer = device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
  verticesBuffer.unmap();

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: /* wgsl */ `      
          struct VertexOutput {
            @builtin(position) Position : vec4f,
            @location(0) fragUV : vec2f,
            @location(1) fragPosition: vec4f,
          }

          struct Uniforms {
            width: f32,
            height: f32,
            seed: f32,
            scale: f32,
            x: f32,
            y: f32,
            z: f32,
            zoom: f32,
            modelViewProjectionMatrix : mat4x4f,
          };

          @group(0) @binding(0) var<uniform> uniforms: Uniforms;

          @vertex
          fn main(
            @location(0) position : vec4f,
            @location(1) uv : vec2f
          ) -> VertexOutput {
            var output : VertexOutput;
            //output.Position = position;
            output.Position = uniforms.modelViewProjectionMatrix * position;
            output.fragUV = uv;
            output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
            return output;
          }

        `,
      }),
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: "float32x4",
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUVOffset,
              format: "float32x2",
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        label: "our hardcoded red color shader",
        code: /* wgsl */ `
          struct Uniforms {
            width: f32,
            height: f32,
            seed: f32,
            scale: f32,
            x: f32,
            y: f32,
            z: f32,
            zoom: f32,
            modelViewProjectionMatrix : mat4x4f
          };

          @group(0) @binding(0) var<uniform> uniforms: Uniforms;
          
          fn noise(seed: f32, coord: vec4<f32>) -> f32 {
            let n: u32 = bitcast<u32>(seed) +
              bitcast<u32>(coord.x * 374761393.0) +
              bitcast<u32>(coord.y * 668265263.0) +
              bitcast<u32>(coord.z * 1440662683.0) +
              bitcast<u32>(coord.w * 3865785317.0);
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

            return 0.5 + 
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 0) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 0) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 0) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 0) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 1) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 1) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 1) +
              vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
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
            if (a < 0.0) {
              return 0.0;
            }

            let h: i32 = bitcast<i32>(noise(seed, vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
            let u: i32 = (h & 0xf) - 8;
            let v: i32 = ((h >> 4) & 0xf) - 8;
            let w: i32 = ((h >> 8) & 0xf) - 8;
            return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
          }

          @vertex fn vs(
            @builtin(vertex_index) vertexIndex : u32
          ) -> @builtin(position) vec4f {
            let pos = array(
              vec2f(-1.0, -1.0),
              vec2f(1.0, 1.0),
              vec2f(-1.0, 1.0) ,
              vec2f(-1.0, -1.0),
              vec2f(1.0, 1.0),
              vec2f(1.0, -1.0)
            );

            return vec4f(pos[vertexIndex], 0.0, 1.0);
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

          @fragment
          fn main(
            @location(0) fragUV: vec2f,
            @location(1) fragPosition: vec4f
          ) -> @location(0) vec4f {
            // return fragPosition;
          //   return vec4(fragUV.xy, 0.0, 0.0);
          // }

            let coord = vec4(fragUV.xy * 100, 0.0, 0.0);
          // @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {

            // calculate point
            let x = coord.x / uniforms.scale * uniforms.zoom + uniforms.x / uniforms.scale;
            let y = coord.y / uniforms.scale * uniforms.zoom + uniforms.y / uniforms.scale;
            let z = uniforms.z;

            let height1 = openSimplex3d(uniforms.seed * 112345, x / 129, y / 129, z / 129);
            let height2 = openSimplex3d(uniforms.seed * 212345, x / 47, y / 47, z / 47);
            let height3 = openSimplex3d(uniforms.seed * 312345, x / 7, y / 7, z / 7);
            let height4 = openSimplex3d(uniforms.seed * 412345, x / 1, y / 1, z / 1);
            let temperature1 = openSimplex3d(uniforms.seed * 512345, x / 71, y / 71, z / 71);
            let temperature2 = openSimplex3d(uniforms.seed * 612345, x / 15, y / 15, z / 15);
            let moisture1 = openSimplex3d(uniforms.seed * 712345, x / 67, y / 67, z / 67);
            let moisture2 = openSimplex3d(uniforms.seed * 812345, x / 13, y / 13, z / 13);
            let height = 0.6 * height1 + 0.3 * height2 + 0.15 * height3 + 0.05 * height4;
            let temperature = 0.7 * temperature1 + 0.3 * temperature2;
            let moisture = 0.7 * moisture1 + 0.3 * moisture2;

            let seaLevel = 0.6;
            let isSea = height < seaLevel;

            let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
            let seaDepth = c(1 - height / seaLevel);
            let iciness = c(heightIcinessCurve(height) + temperatureIcinessCurve(temperature));
            let desert = c(moistureDesertCurve(moisture) + temperatureDesertCurve(temperature));

            // convert point to color
            let sh = heightAboveSeaLevel;
            let sd = seaDepth;
            let m = moisture;
            let t = temperature;
            let i = iciness;
            let d = desert;

            if (isSea) {
              let seaHsv = vec3f(
                229.0 / 360.0,
                0.47 + sd * 0.242 - 0.1 + t * 0.2,
                0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
              );
              
              return vec4<f32>(hsv2rgb(vec3f(
                seaHsv[0], 
                c(seaHsv[1] - 0.2 * i), 
                c(seaHsv[2] + 0.2 * i)
              )), 1.0);
            } else {
              let landHsv = vec3f(
                77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
                0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
                0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
              );

              return vec4<f32>(hsv2rgb(vec3f(
                landHsv[0] - d * 0.1,
                c(landHsv[1] - 0.3 * i + d * 0.1),
                c(landHsv[2] + 0.6 * i + d * 0.45),
              )), 1.0);
            }
          }
    `,
      }),
      targets: [{ format: presentationFormat }],
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

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });


  const s1 = sharedData.asBuffer().byteLength;
  const offset = 256; // uniformBindGroup offset must be 256-byte aligned
  const uniformBufferSize = offset + s1;


  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // console.log(sharedData.asBuffer().byteLength)
  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: sharedData.asBuffer().byteLength,
        },
      },
    ],
  });

  const uniformBindGroup2 = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: offset,
          size: sharedData2.asBuffer().byteLength,
        },
      },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };


  const modelMatrix1 = mat4.translation(vec3.create(-2, 2, 0));
  const modelMatrix2 = mat4.translation(vec3.create(2, 2, 0));
  const modelViewProjectionMatrix1 = mat4.create();
  const modelViewProjectionMatrix2 = mat4.create();
  const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -8));

  const tmpMat41 = mat4.create();
  const tmpMat42 = mat4.create();
  function updateTransformationMatrix() {
    const now = Date.now() / 1000;

    mat4.rotate(
      modelMatrix1,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      1,
      tmpMat41
    );
    mat4.rotate(
      modelMatrix2,
      vec3.fromValues(Math.cos(now), Math.sin(now), 0),
      1,
      tmpMat42
    );

    mat4.multiply(viewMatrix, tmpMat41, modelViewProjectionMatrix1);
    mat4.multiply(
      projectionMatrix,
      modelViewProjectionMatrix1,
      modelViewProjectionMatrix1
    );
    mat4.multiply(viewMatrix, tmpMat42, modelViewProjectionMatrix2);
    mat4.multiply(
      projectionMatrix,
      modelViewProjectionMatrix2,
      modelViewProjectionMatrix2
    );
  }

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      Object.assign(sharedData, data);
      Object.assign(sharedData2, data);
      sharedData.z = time * 0.001;
      updateTransformationMatrix();

      sharedData.modelViewProjectionMatrix = modelViewProjectionMatrix1;
      device.queue.writeBuffer(uniformBuffer, 0, sharedData.asBuffer());

      sharedData2.modelViewProjectionMatrix = modelViewProjectionMatrix2;
      device.queue.writeBuffer(uniformBuffer, offset, sharedData2.asBuffer());

      // console.log(modelViewProjectionMatrix2.byteOffset, modelViewProjectionMatrix1.byteOffset)
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "our encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, verticesBuffer);

      pass.setBindGroup(0, uniformBindGroup);
      pass.draw(cubeVertexCount);

      pass.setBindGroup(0, uniformBindGroup2);
      pass.draw(cubeVertexCount);

      pass.end();
      device.queue.submit([encoder.finish()]);

      return device.queue.onSubmittedWorkDone();
    },
  };
}
</script>

<style scoped></style>
