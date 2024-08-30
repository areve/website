<template>
  <section>
    <h1>Curves</h1>
    <p>
      I needed a curve for a program to map some colours. This lead me to a
      whole lot of learning about curves and splines. These are some experiments
      I created during that. And a tool to visualize and compare curves.
    </p>

    <CurvesGraph
      :dimensions="{
        width: 300 * getDevicePixelRatio(),
        height: 300 * getDevicePixelRatio(),
      }"
      :funcs="funcs"
      label=""
    ></CurvesGraph>
  </section>
</template>

<script lang="ts" setup>
import { getDevicePixelRatio } from "./lib/render";
import { makeSmoothCurveFunction } from "./lib/curves";
import CurvesGraph from "./CurvesGraph.vue";

const smoothstepHalf = (t: number): number => (t * t * (3 - t * 2) + t) / 2;
const smoothstep = (t: number): number => t * t * (3 - t * 2);
const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

const funcs = [
  {
    label: "custom smooth curve",
    color: [1, 1, 0],
    func: makeSmoothCurveFunction([
      { x: 0, y: 0 },
      { x: 0.3, y: 0.3 },
      { x: 0.65, y: 0.12 },
      { x: 0.85, y: 0.9 },
      { x: 1, y: 1 },
    ]),
  },
  {
    label: "straight line",
    color: [0, 1, 0],
    func: (x: number) => x,
  },
  {
    label: "sin based = (1 - cos(πx)) / 2",
    color: [1, 0.2, 0.2],
    func: (x: number) => (-Math.cos(Math.PI * x) + 1) / 2,
  },
  {
    label: "smoothstep = t * t * t * (t * (t * 6 - 15) + 10)",
    color: [0, 1, 1],
    func: smoothstep,
  },
  {
    label: "smootherstep = t * t * (3 - t * 2)",
    color: [1, 0, 1],
    func: smootherstep,
  },
  {
    label: "smoothstepHalf - my own in-between variation",
    color: [0.3, 0.5, 1],
    func: smoothstepHalf,
  },
];
</script>

<style scoped></style>
