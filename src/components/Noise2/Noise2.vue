<template>
  <article>
    <h1>Noise2</h1>
    <p>
      This page doesn't work in all browsers, but it's using WebGPU to render noise on the GPU, much faster than all my previous efforts.
      Controls and keyboard shortcuts are listed below for quick reference.
    </p>
    <ul class="controls">
      <li><kbd>Mouse</kbd> : drag to pan, scroll/wheel to zoom</li>
      <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> : pan the view (A = left, D = right, W = up, S = down)</li>
      <li><kbd>'</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard accelerator)</li>
      <li><kbd>Space</kbd> or <kbd>P</kbd> : pause / resume animation; double-click/tap also toggles pause</li>
      <li>Touch : two-finger pinch to zoom, drag to pan</li>
    </ul>
    <p>
      <div>WebGPUNoise</div>
      <WebGPUNoise />
    </p>
    <p>
      <div>WebGPUColorNoise</div>
      <WebGPUColorNoise />
    </p>
    <p>
      <div>WebGPUValueNoise</div>
      <WebGPUValueNoise />
    </p>
    <p>
      <div>WebGPUMandelbrot</div>
      <WebGPUMandelbrot />
    </p>
    <p>
      <div>WebGPUOpenSimplex</div>
      <WebGPUOpenSimplex />
    </p>
    <p>
      <div>WebGPUWorld</div>
      <WebGPUWorld />
    </p> 
  </article>
</template>

<script lang="ts" setup>
import WebGPUNoise from "./WebGPUNoise.vue";
import WebGPUColorNoise from "./WebGPUColorNoise.vue";
import WebGPUValueNoise from "./WebGPUValueNoise.vue";
import WebGPUMandelbrot from "./WebGPUMandelbrot.vue";
import WebGPUOpenSimplex from "./WebGPUOpenSimplex.vue";
import WebGPUWorld from "./WebGPUWorld.vue";

</script>

<style scoped></style>
