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
import { setupWorldRenderer } from "./lib/setupWorldRenderer";

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
</script>

<style scoped></style>
