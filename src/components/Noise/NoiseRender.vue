<template>
  <section>
    <div
      class="canvas-wrap"
      :style="{
        height: dimensions.height + 'px',
        width: dimensions.width + 'px',
      }"
    >
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <div class="noise-render-slot">
      <slot></slot>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { Dimensions, Coord } from "./lib/interfaces";
import { render } from "./lib/render";

export interface NoiseRenderProps {
  dimensions: Dimensions;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<NoiseRenderProps>();
const dimensions = computed(() => props.dimensions);
const pixel = (coord: Coord) => {
  return [Math.random(), Math.random(), Math.random()];
};

const update = () => render(canvas.value, dimensions.value, pixel);
onMounted(update);
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  border: 2px solid #666;
  display: inline-block;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>

<style>
.noise-render-slot h1 {
  font-size: 1em;
  font-weight: 400;
}
</style>
