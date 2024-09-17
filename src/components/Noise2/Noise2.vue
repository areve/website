<template>
  <article>
    <h1>Noise2</h1>
    <p>This page doesn't work in all browsers, but its using WebGPU to render noise on the GPU, much faster than all my previous efforts.</p>
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
    <p>
      <div>WebGPUWorld3d</div>
      <WebGPUWorld3d />
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
import WebGPUWorld3d from "./WebGPUWorld3d/WebGPUWorld3d.vue";
</script>

<style scoped></style>
