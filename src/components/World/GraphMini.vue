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
import { render } from "./lib/render";
import { Coord, Dimensions } from "./lib/interfaces";
import { distanceFromPointToLine } from "./curves/distanceFromPointToLine";

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
  const x = coord.x / dimensions.value.width;
  const y = (dimensions.value.height - coord.y) / dimensions.value.height;
  const step = 1 / dimensions.value.width;
  const x0 = x - step;
  const x1 = x;
  const x2 = x + step;

  const colors = [];
  for (let i = 0; i < funcs.value.length; ++i) {
    const func = funcs.value[i];

    const y0 = func.func(x0);
    const y1 = func.func(x1);
    const y2 = func.func(x2);

    const da = distanceFromPointToLine(
      { x, y },
      { x: x0, y: y0 },
      { x: x1, y: y1 }
    );
    const db = distanceFromPointToLine(
      { x, y },
      { x: x1, y: y1 },
      { x: x2, y: y2 }
    );
    const nearest = Math.min(da, db);

    const n = 1 - clamp(nearest / step, 0, 1);
    const color = [func.color[0] * n, func.color[1] * n, func.color[2] * n];
    colors.push(color);
  }
  const c = colors.reduce(
    (p, v) => [p[0] + v[0], p[1] + v[1], p[2] + v[2]],
    [0, 0, 0]
  );
  return [...c, 1];
};

const update = () => render(canvas.value, props.dimensions, pixel);
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
