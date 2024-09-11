<template>
  <canvas ref="canvas" class="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
  {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
  {{ controller.zoom.toFixed(2) }}zoom
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const controller = makeController();
const width = 500;
const height = 200;
const seed = 12345;

let frameId: number = 0;
onMounted(async () => {
  controller.value.mount(canvas.value);
  const renderer = await setupNoiseRenderer(canvas.value, {
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

async function setupNoiseRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 4,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
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

  const module = device.createShaderModule({
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
        zoom: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
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
        let n = noise(
          vec4<f32>(
            coord.x / data.scale * data.zoom + data.x / data.scale, 
            coord.y / data.scale * data.zoom + data.y / data.scale, 
            data.z, 
            0.0));
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

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });


  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
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
      // sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "our encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6); // call our vertex shader 3 times.
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
</script>

<style scoped>
.canvas {
  touch-action: none;
}
</style>
