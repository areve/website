<template>
  <div class="graph-mini">
    <div class="canvas-wrap">
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <div>{{ label }}</div>
  </div>
</template>

<script lang="ts" setup>
const canvas = ref<HTMLCanvasElement>(undefined!);
import { computed, onMounted, ref } from "vue";
import { clamp, Rgb } from "./lib/other";
import { getContext, render } from "./lib/render";
import { Coord, Dimensions } from "./lib/interfaces";

export interface GraphProps {
  dimensions: Dimensions;
  label: string;
  funcs: {  
    color: Rgb;
    func: (t: number) => number;
  }[];
}

const props = defineProps<GraphProps>();
const dimensions = computed(() => props.dimensions);
const funcs = computed(() => props.funcs);

const pixel = (coord: Coord) => {
  const rx = coord.x / dimensions.value.width;
  const ry = (dimensions.value.height - coord.y) / dimensions.value.height;
  const dot = 1 / dimensions.value.width;

  const colors = [];
  for (let j = 0; j < funcs.value.length; ++j) {
    const func = funcs.value[j];
    let nearest = Infinity;
    let steps = 5; // kind of antialias steps
    for (let i = -steps / 2; i < steps / 2; ++i) {
      const offset = (dot / steps) * i;
      const ax = rx + offset;
      const y = func.func(ax);
      const d = Math.sqrt((ax - rx) ** 2 + (y - ry) ** 2) ;
      nearest = Math.min(d, nearest);
    }
    const n = 1 - clamp(nearest / dot, 0, 1);
    const color = [func.color[0] * n, func.color[1] * n, func.color[2] * n];
    colors.push(color);
  }
  const c = colors.reduce(
    (p, v) => [p[0] + v[0], p[1] + v[1], p[2] + v[2]],
    [0, 0, 0]
  );
  return [...c, 1];
};

const update = () => {
  render(canvas.value, props.dimensions, pixel);
};

onMounted(update);
</script>

<style scoped>
.graph-mini .canvas-wrap {
  position: relative;
  height: 48px;
  width: 48px;
  /* border: 2px solid #666; */
}
.graph-mini .canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>
