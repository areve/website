<template>
  <article>
    <h1>Procedural</h1>
    <p>Procedural image generation with WebGPU. Double-tap to open fullscreen, pinch, drag, see more below.</p>
    <ProceduralRenderer />
    <p>Controls and keyboard shortcuts are listed below.</p>
    <ul class="controls">
      <li><kbd>Mouse</kbd> : drag to pan, scroll/wheel to zoom</li>
      <li>
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> : pan the view (A =
        left, D = right, W = up, S = down)
      </li>
      <li>
        <kbd>'</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard
        accelerator)
      </li>
      <li><kbd>,</kbd> (comma) / <kbd>.</kbd> (period) : rotate counter-clockwise / clockwise</li>
      <li><kbd>Space</kbd> or <kbd>P</kbd> : pause / resume animation</li>
      <li>
        <kbd>M</kbd> : change between OpenSimplex and OpenSimplex + Trigonometry
        modes
      </li>
      <li><kbd>F</kbd> : toggle full screen mode; also double-click/tap</li>
      <li><kbd>Touch</kbd> : two-finger pinch to zoom, drag to pan, rotate with two fingers</li>
    </ul>
  </article>
</template>

<script lang="ts" setup>
import ProceduralRenderer from "./ProceduralRenderer.vue";
</script>

<style scoped></style>
