<template>
  <canvas ref="canvas"></canvas>
</template>

<script lang="ts" setup>
import { Ref, ref } from "vue";

const canvas = ref<HTMLCanvasElement>(undefined!);

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

  
// export const makeValueNoiseGenerator = (seed: number, scale: number = 8) => {
//   const noise = makeNoiseGenerator(seed);

//   const smoothstepHalf = (t: number): number => (t * t * (3 - t * 2) + t) / 2;

//   const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

//   return (x: number, y: number): number => {
//     const ix = Math.floor(x / scale);
//     const iy = Math.floor(y / scale);
//     const fx = (x % scale) / scale;
//     const fy = (y % scale) / scale;

//     const p0 = noise(ix, iy);
//     const p1 = noise(ix, iy + 1);
//     const p2 = noise(ix + 1, iy);
//     const p3 = noise(ix + 1, iy + 1);

//     const sx = smoothstepHalf(fx);
//     const sy = smoothstepHalf(fy);
//     const m1 = lerp(p0, p1, sy);
//     const m2 = lerp(p2, p3, sy);
//     return lerp(m1, m2, sx);
//   };
// };


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
        return vec4<f32>( 
          noise(vec4(coord.xy, 0.0, 0.0)), 
          noise(vec4(coord.xy, 1.0, 0.0)), 
          noise(vec4(coord.xy, 2.0, 0.0)), 
          1.0);
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
    12345
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
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
main();
</script>

<style scoped></style>
