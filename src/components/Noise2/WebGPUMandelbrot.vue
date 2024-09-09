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

  const module = device.createShaderModule({
    label: "our hardcoded red color shader",
    code: /* wgsl */`
      struct Uniforms {
          width: f32,
          height: f32,
          seed: f32,
          time: f32
      };

      @group(0) @binding(0) var<uniform> uUniforms: Uniforms;

      fn mandelbrot(x: f32, y: f32) -> f32 {
        let r0: f32 = x / 300.0 - 2.0;
        let i0: f32 = y / 300.0 - 0.05;
        let maxIterations: i32 = 40;

        var r: f32 = 0.0;
        var i: f32 = 0.0;
        var iteration: i32 = 0;

        while (r * r + i * i <= 4.0 && iteration < maxIterations) {
            let rTemp: f32 = r * r - i * i + r0;
            i = 2.0 * r * i + i0;
            r = rTemp;
            iteration = iteration + 1;
        }

        return f32(iteration) / f32(maxIterations);
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
        let dummy = abs((uUniforms.time - floor(uUniforms.time)) * 2 - 1.0);
        let n = mandelbrot(coord.x, coord.y);
        return vec4<f32>(n, n, dummy, 1.0);
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
    uniformValues[3] = time * 0.0001;
    // console.log(uniformValues[3]);
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
