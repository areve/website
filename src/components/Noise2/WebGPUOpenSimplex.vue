<template>
  <canvas ref="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps
</template>

<script lang="ts" setup>
import { computed, Ref, ref } from "vue";
import { makeStats } from "./lib/stats";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.value.width = 500;
  canvas.value.height = 200;

  const context = canvas.value.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    label: "our hardcoded red color shader",
    code: `
      struct Uniforms {
          width: f32,
          height: f32,
          seed: f32,
          time: f32
      };

      @group(0) @binding(0) var<uniform> uUniforms: Uniforms;

      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(uUniforms.seed) +
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

fn simplex3d(x: f32, y: f32, z: f32) -> f32 {
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

    return vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
           vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) + 0.5;
}

fn vertexContribution(
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

    // Simulate the noise function here (bit manipulation as in the original)
    // return noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0));;

    let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
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

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let dummy = uUniforms.time;
        let n = simplex3d(coord.x / 8, coord.y / 8, uUniforms.time);
        return vec4<f32>(n, n, n, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const uniformValues = new Float32Array([
    canvas.value.width,
    canvas.value.height,
    0,
    12345,
  ]);
  const uniformBuffer = device.createBuffer({
    size: uniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
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
  };

  function render(time: DOMHighResTimeStamp) {
    uniformValues[3] = time * 0.001;
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    colorAttachment.view = context.getCurrentTexture().createView();
    const encoder = device.createCommandEncoder({ label: "our encoder" });
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6); // call our vertex shader 3 times.
    pass.end();
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
    stats.value.update();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
main();
</script>

<style scoped></style>
