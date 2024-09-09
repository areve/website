<template>
  <canvas ref="canvas"></canvas>
</template>

<script lang="ts" setup>
import { Ref, ref } from "vue";

const canvas = ref<HTMLCanvasElement>(undefined!);

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) {
    fail("need a browser that supports WebGPU");
    return;
  }
  canvas.value.width = 500;
  canvas.value.height = 200;

  const context = canvas.value.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  // Pass canvas width and height to the GPU
  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;

  const module = device.createShaderModule({
    label: "our hardcoded red line shaders",
    code: `
      struct Uniforms {
          width: f32,
          height: f32,
          time: f32
      };
      // @group(0) @binding(0) var<uniform> time: f32;
      @group(0) @binding(0) var<uniform> uUniforms: Uniforms;

      @vertex fn vs(
        @builtin(vertex_index) vNdx : u32
      ) -> @builtin(position) vec4f {
        let v = f32(vNdx) * 2.0 - 1.0;
        let xy = vec2f(
          v * cos(uUniforms.time),
          v * sin(uUniforms.time),
        );
        return vec4f(xy, 0.0, 1.0);
      }
      // @vertex fn vs(
      //   @builtin(vertex_index) vertexIndex : u32
      // ) -> @builtin(position) vec4f {
      //   let pos = array(
      //     vec2f(-1.0, -1.0),
      //     vec2f(1.0, 1.0),
      //     vec2f(-1.0, 1.0) ,
      //     vec2f(-1.0, -1.0),
      //     vec2f(1.0, 1.0),
      //     vec2f(1.0, -1.0) 
      //   );
 
      //   return vec4f(pos[vertexIndex], 0.0, 1.0);
      // }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        //return vec4f(1, 0, 0, 1);
        return vec4<f32>( coord.x / 400, coord.y / 400, 0.0, 1.0);
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
    primitive: {
      topology: "line-list",
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

  const renderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        // view: context.getCurrentTexture().createView(),
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  uniformValues[0] = canvasWidth;
  uniformValues[1] = canvasHeight;

  function render(time) {
    // Update the uniforms.
    uniformValues[2] = time * 0.001;
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "our encoder" });

    // make a render pass encoder to encode render specific commands
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
