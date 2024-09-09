<template>
  <article>
    <h1>Noise2</h1>
    <p>
      WebGPUNoise
      <WebGPUNoise />
    </p>
    <p>
      WebGPUColorNoise
      <WebGPUColorNoise />
    </p>
    <p>
      WebGPUValueNoise
      <WebGPUValueNoise />
    </p>
  </article>
</template>

<script lang="ts" setup>
import WebGPUNoise from "./WebGPUNoise.vue";
import WebGPUColorNoise from "./WebGPUColorNoise.vue";
import WebGPUValueNoise from "./WebGPUValueNoise.vue";
</script>

<style scoped></style>
