<template>
  <div class="graph-mini">
    <div class="title">{{ label }}</div>
    <div
      class="canvas-wrap"
      :style="{
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      }"
    >
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <div class="key">
      <div v-for="func in funcs">
        <div
          class="spot"
          :style="{
            backgroundColor: 'rgb(' + func.color.map((c) => c * 255) + ')',
          }"
        ></div>
        {{ func.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { distanceFromPointToLineSegment } from "./curves/distanceFromPointToLineSegment";
import { Rgb, Rgba } from "./lib/color";
import { clamp } from "./lib/clamp";
import { Dimensions, render } from "./lib/render";

export interface GraphProps {
  dimensions: Dimensions;
  label: string;
  funcs: {
    label: string;
    color: Rgb;
    func: (t: number) => number;
  }[];
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<GraphProps>();
const dimensions = computed(() => props.dimensions);
const funcs = computed(() => props.funcs);

const pixel = (ix: number, iy: number): Rgba => {
  let { width, height } = dimensions.value;
  const x = ix / width;
  const y = (height - iy) / height;
  const step = 1 / width;
  const x0 = x - step;
  const x1 = x;
  const x2 = x + step;

  const colors = [];
  for (let i = 0; i < funcs.value.length; ++i) {
    const func = funcs.value[i];

    const y0 = func.func(x0);
    const y1 = func.func(x1);
    const y2 = func.func(x2);

    const da = distanceFromPointToLineSegment(
      { x, y },
      { x: x0, y: y0 },
      { x: x1, y: y1 }
    );
    const db = distanceFromPointToLineSegment(
      { x, y },
      { x: x1, y: y1 },
      { x: x2, y: y2 }
    );
    const nearest = Math.min(da, db);

    const n = 1 - clamp(nearest / step, 0, 1);
    const color = [func.color[0] * n, func.color[1] * n, func.color[2] * n];
    colors.push(color);
  }
  const c = colors.reduce<Rgb>(
    (p, v) => [p[0] + v[0], p[1] + v[1], p[2] + v[2]],
    [0, 0, 0]
  );
  return [...c, 1];
};

const update = () => render(canvas.value, dimensions.value, pixel);
onMounted(update);
</script>

<style scoped>
.graph-mini .canvas-wrap {
  position: relative;
  /* border: 2px solid #666; */
  display: inline-block;
}
.graph-mini .canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
.key {
  font-size: 0.8em;
  line-height: 1.2em;
  display: inline-block;
}
.key .spot {
  position: relative;
  width: 1em;
  height: 1em;
  display: inline-block;
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.5);
}
</style>
