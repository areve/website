<template>
  <section>
    <h1>Noise</h1>
    <p>
      Whilst generating maps I looked at different ways to generate noise,
      splines and curves.
    </p>

    <NoiseRender :dimensions="{ width: 200, height: 200}"></NoiseRender>
    <NoiseRender :dimensions="{ width: 200, height: 200}"></NoiseRender>
  </section>
</template>

<script lang="ts" setup>
import NoiseRender from "./NoiseRender.vue";
</script>

<style scoped></style>
