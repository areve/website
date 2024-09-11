<template>
  <article>
    <h1>Noise2</h1>
    <!-- <p>
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
    </p>-->
    <p>
      <div>WebGPUMandelbrot</div>
      <WebGPUMandelbrot />
    </p>
    <!--<p>
      <div>WebGPUOpenSimplex</div>
      <WebGPUOpenSimplex />
    </p> -->
  </article>
</template>

<script lang="ts" setup>
import WebGPUNoise from "./WebGPUNoise.vue";
import WebGPUColorNoise from "./WebGPUColorNoise.vue";
import WebGPUValueNoise from "./WebGPUValueNoise.vue";
import WebGPUMandelbrot from "./WebGPUMandelbrot.vue";
import WebGPUOpenSimplex from "./WebGPUOpenSimplex.vue";
</script>

<style scoped></style>
