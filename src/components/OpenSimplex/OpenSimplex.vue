<template>
  <article>
    <h1>Open Simplex</h1>
    <p>
      OpenSimplex noise rendered using WebGPU on the GPU.
      Controls and keyboard shortcuts are listed below for quick reference.
    </p>
    <p>
      <div>WebGPUOpenSimplex</div>
      <WebGPUOpenSimplex />
    </p>
    <ul class="controls">
      <li><kbd>Mouse</kbd> : drag to pan, scroll/wheel to zoom</li>
      <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> : pan the view (A = left, D = right, W = up, S = down)</li>
      <li><kbd>'</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard accelerator)</li>
      <li><kbd>Space</kbd> or <kbd>P</kbd> : pause / resume animation</li>
      <li><kbd>M</kbd> : change between OpenSimplex and OpenSimplex + Trigonometry modes</li>
      <li><kbd>F</kbd> : toggle full screen mode; also double-click/tap</li>
      <li><kbd>Touch</kbd> : two-finger pinch to zoom, drag to pan</li>
    </ul>
  </article>
</template>

<script lang="ts" setup>
import WebGPUOpenSimplex from "./WebGPUOpenSimplex.vue";
</script>

<style scoped></style>
