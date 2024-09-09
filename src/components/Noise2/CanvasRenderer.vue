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

  console.clear();
  const module = device.createShaderModule({
    label: "our hardcoded red color shader",
    code: `
      struct Uniforms {
          width: f32,
          height: f32,
          time: f32
      };

      @group(0) @binding(0) var<uniform> uUniforms: Uniforms;

      fn zzz() -> f32 {
        return 0.5;
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
        return vec4<f32>( coord.x / uUniforms.width * sin(uUniforms.time), zzz(), zzz(), 1.0);
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

  const uniformValues = new Float32Array(3);
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

  uniformValues[0] = canvas.value.width;
  uniformValues[1] = canvas.value.height;

  function render(time: DOMHighResTimeStamp) {
    uniformValues[2] = time * 0.001;
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
