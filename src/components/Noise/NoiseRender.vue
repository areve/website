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
    <div class="noise-render-slot caption">
      <slot></slot> ({{ (ratePixelsPerSecond / 1000000).toPrecision(3) }}
      Mpix/sec)
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Dimensions, Coord, Camera } from "./lib/interfaces";
import { render } from "./lib/render";
import { Rgb } from "./lib/other";

export interface NoiseRenderProps {
  dimensions: Dimensions;
  camera: Camera;
  frame: number;
  pixel: (coord: Coord | number, y?: number) => Rgb;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<NoiseRenderProps>();
const dimensions = computed(() => props.dimensions);
const randomPixel = (coord: Coord) => [
  Math.random(),
  Math.random(),
  Math.random(),
];
const pixel = computed(() => props.pixel ?? randomPixel);
const ratePixelsPerSecond = ref(0);

const update = () => {
  const start = window.performance.now();
  render(canvas.value, dimensions.value, pixel.value, props.camera);
  const end = window.performance.now();
  const pixels = dimensions.value.height * dimensions.value.width;
  ratePixelsPerSecond.value = (pixels / (end - start)) * 1000;
};
onMounted(update);
watch(props, update);
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
  margin: 0;
  border: 0px solid #999;
}
.caption {
  margin-top: -0.5em;
  font-size: 0.9em;
  font-style: italic;
}
</style>

<style>
.noise-render-slot h1 {
  font-size: 1em;
  font-weight: 400;
}
</style>
