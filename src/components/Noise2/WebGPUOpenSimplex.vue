<template>
  <canvas ref="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps
  {{ controller.x }}x
  {{ controller.y }}y
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";
import { setupOpenSimplexRenderer } from "./lib/setupOpenSimplexRenderer";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const controller = makeController();
const width = 500;
const height = 200;
const seed = 12345;

let frameId: number = 0;
onMounted(async () => {
  controller.value.mount()
  const renderer = await setupOpenSimplexRenderer(canvas.value, {
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
  controller.value.unmount()
});
</script>

<style scoped></style>
