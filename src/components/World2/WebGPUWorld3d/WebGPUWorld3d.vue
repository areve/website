<template>
  <canvas ref="canvas" class="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
  {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
  {{ controller.zoom.toFixed(2) }}zoom
  <span v-if="controller.paused">paused</span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "../lib/stats";
import { makeController } from "../lib/controller";
import { vec3 } from "wgpu-matrix";
import { createRenderer, getDeviceContext } from "./lib/webgpu";
import { createCube } from "./models/createCube";
import { createPlane } from "./models/createPlane";
import { createCamera } from "./lib/camera";
import { createWorldCompute } from "./models/worldCompute";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const controller = makeController({
  acceleratorKeys: {
    zoom: {
      origin: "baseline",
    },
  },
  basicKeys: {
    pause: {
      startPaused: false,
    },
  },
});

const width = 500;
const height = 500;
const seed = 12345;

let frameId: number = 0;
let cancelled = false;
onMounted(async () => {
  controller.value.mount(canvas.value);
  const renderer = await setupWorldRenderer(canvas.value, {
    width,
    height,
    seed,
  });
  await renderer.init();
  await renderer.update(0, controller.value);
  const render = async (time: DOMHighResTimeStamp) => {
    if (!controller.value.paused) {
      await renderer.update(time, controller.value);
      controller.value.update();
      stats.value.update();
    }
    if (!cancelled) frameId = requestAnimationFrame(render);
  };

  if (!cancelled) frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  cancelled = true;
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
  const { device, context } = await getDeviceContext(
    canvas,
    options.width,
    options.height
  );

  const worldMapUniforms = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    toBuffer() {
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

  const camera = createCamera(options.width, options.height);

  const textureStorageBuffer = device.createBuffer({
    size: 1000 * 1000 * 6,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  const cube = createCube(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera
  );

  const plane = createPlane(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera,
    textureStorageBuffer
  );

  const worldCompute = createWorldCompute(
    device,
    () => worldMapUniforms.toBuffer(),
    textureStorageBuffer
  );

  const renderer = createRenderer(device, options.width, options.height);

  // Init code, kind of optional
  // {
  //   cube.updateBuffers();
  //   plane.updateBuffers();
  //   await plane.compute(device);
  // }

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      const t = time * 0.001;
      if (data) Object.assign(worldMapUniforms, data);
      worldMapUniforms.z = t;
      cube.transform.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      cube.updateBuffers();
      plane.updateBuffers();
      worldCompute.updateBuffers();

      await worldCompute.compute(device);
      // await plane.compute(device); // TODO only needed if uniforms changed, perhaps it can make that decision itself

      renderer.setup(context);
      const encoder = device.createCommandEncoder();
      const renderPass = renderer.getRenderPass(encoder);
      cube.render(renderPass);
      plane.render(renderPass);
      renderPass.end();

      // waiting for paint to complete before requesting another slows the framerate but seems far less wasteful
      return renderer.end(encoder);
    },
  };
}
</script>

<style scoped></style>
