<template>
  <article>
    <h1>Piano</h1>
    <p>WGSL-based canvas placeholder. Piano rendering will be added later.</p>

    <div class="canvas-container">
      <canvas ref="canvas" class="canvas" tabindex="0"></canvas>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  // placeholder: user will initialize WebGPU / WGSL here later
});

onUnmounted(() => {
  // cleanup placeholder
});
</script>

<style scoped>
.canvas {
  touch-action: none;
}

.canvas-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.canvas-container .canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Fullscreen helpers */
.canvas-container:fullscreen,
.canvas-container:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
}

.canvas-container:fullscreen .canvas,
.canvas-container:-webkit-full-screen .canvas {
  width: 100%;
  height: 100%;
}
</style>
