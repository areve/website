<template>
  <canvas
    ref="canvas"
    class="canvas"
  ></canvas>
  <div class="controls-overlay">
    <div class="stats">
      {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
      {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
      {{ controller.zoom.toFixed(2) }}zoom
      <span v-if="controller.paused">paused</span>
    </div>
    <label class="mode-select">
      Mode:
      <select @change="handleSelectMode" v-model="shaderMode">
        <option value="simplex">OpenSimplex</option>
        <option value="trigonometry">OpenSimplex + Trigonometry</option>
      </select>
    </label>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";
import { setupOpenSimplexRenderer } from "./renderer/setupOpenSimplexRenderer";

const canvas = ref<HTMLCanvasElement>(undefined!);
const stats = makeStats();
const controller = makeController({
  basicKeys: {
    pause: { startPaused: false },
  },
});
const width = 500;
const height = 500;
const seed = 12345;
const shaderMode = ref<"simplex" | "trigonometry">("trigonometry");

let frameId: number = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const availableModes = ["simplex", "trigonometry"] as const;

const handleChangeMode = async () => {
  const idx = availableModes.indexOf(shaderMode.value);
  const next = availableModes[(idx + 1) % availableModes.length];
  shaderMode.value = next;
  await initializeCanvas()
};

const handleSelectMode = async (event: Event) => {
  await initializeCanvas()
};

const handleToggleFullscreen = () => {
  const canvasElement = canvas.value;

  if (!document.fullscreenElement) {
    canvasElement.requestFullscreen?.().catch(() => {
      console.warn("Failed to enter fullscreen mode");
    });
  } else {
    document.exitFullscreen?.();
  }
};

const initializeCanvas = async () => {
  const isFs = !!document.fullscreenElement;
  const newWidth = isFs ? window.innerWidth : width;
  const newHeight = isFs ? window.innerHeight : height;

  renderer = await setupOpenSimplexRenderer(canvas.value, {
    width: newWidth,
    height: newHeight,
    seed,
    shaderMode: shaderMode.value,
  });
  await renderer.init();
};

onMounted(async () => {
  controller.value.mount(canvas.value);
  renderer = await setupOpenSimplexRenderer(canvas.value, {
    width,
    height,
    seed,
    shaderMode: shaderMode.value,
  });
  await renderer.init();
  await renderer.update(0, controller.value);

  document.addEventListener("changeMode", handleChangeMode);
  document.addEventListener("toggleFullscreen", handleToggleFullscreen);
  document.addEventListener("fullscreenchange", initializeCanvas);

  const render = async (time: DOMHighResTimeStamp) => {
    if (!controller.value.paused) {
      await renderer.update(time, controller.value);
      controller.value.update();
      stats.value.update();
    }
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  document.removeEventListener("changeMode", handleChangeMode);
  document.removeEventListener("toggleFullscreen", handleToggleFullscreen);
  document.removeEventListener("fullscreenchange", initializeCanvas);
  cancelAnimationFrame(frameId);
  controller.value.unmount();
});
</script>

<style scoped>
.canvas {
  touch-action: none;
}
</style>
