<template>
  <canvas ref="canvas"></canvas>
  {{ stats.fps.toPrecision(3) }}fps
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "./lib/stats";
import { setupOpenSimplexRenderer } from "./lib/setupOpenSimplexRenderer";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const width = 500;
const height = 200;
const seed = 12345;

let frameId: number = 0;
onMounted(async () => {
  const renderer = await setupOpenSimplexRenderer(canvas.value, {
    width,
    height,
    seed,
  });
  const render = (time: DOMHighResTimeStamp) => {
    renderer.update(time);
    stats.value.update();
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(frameId);
});
</script>

<style scoped></style>
