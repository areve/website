<template>
  <section>
    <h1>Curves</h1>
    <p>
      I needed a curve for a program to map some colours. This lead me to a
      whole lot of learning about curves and splines. These are some experiments
      I created during that. And a tool to visualize and compare curves.
    </p>

    <figure>
      <figcaption>A selection of curve functions</figcaption>
      <CurvesGraph
        :dimensions="{
          width: 300 * getDevicePixelRatio(),
          height: 300 * getDevicePixelRatio(),
        }"
        :funcs="funcs"
        label=""
      ></CurvesGraph>
    </figure>

    <figure>
      <figcaption>Experiments in creating custom curves</figcaption>
      <CurvesGraph
        :dimensions="{
          width: 300 * getDevicePixelRatio(),
          height: 300 * getDevicePixelRatio(),
        }"
        :funcs="funcs2"
        label=""
      ></CurvesGraph>
    </figure>
  </section>
</template>

<script lang="ts" setup>
import { getDevicePixelRatio } from "./lib/render";
import { makeSmoothCurveFunction } from "./lib/curves";
import CurvesGraph from "./CurvesGraph.vue";
import { Rgb } from "./lib/color";

const smoothstepHalf = (t: number): number => (t * t * (3 - t * 2) + t) / 2;
const smoothstep = (t: number): number => t * t * (3 - t * 2);
const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

const funcs = [
  {
    label: "custom smooth curve",
    color: [1, 1, 0] as Rgb,
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
    color: [0, 1, 0] as Rgb,
    func: (x: number) => x,
  },
  {
    label: "sin based = (1 - cos(πx)) / 2",
    color: [1, 0.2, 0.2] as Rgb,
    func: (x: number) => (-Math.cos(Math.PI * x) + 1) / 2,
  },
  {
    label: "smootherstep = t * t * t * (t * (t * 6 - 15) + 10)",
    color: [0, 1, 1] as Rgb,
    func: smootherstep,
  },
  {
    label: "smoothstep = t * t * (3 - t * 2)",
    color: [1, 0, 1] as Rgb,
    func: smoothstep,
  },
  {
    label: "smoothstepHalf - my own in-between variation",
    color: [0.3, 0.5, 1] as Rgb,
    func: smoothstepHalf,
  },
];

const funcs2 = [
  {
    label: "temperature iciness",
    color: [1, 0, 1] as Rgb,
    func: (t: number) => smootherstep((1 - t ** 2) ** 10),
  },
  {
    label: "temperature iciness piecewise",
    color: [0.7, 0, 0.7] as Rgb,
    func: (t: number) => 1 - piecewiseCurve(t, 0.18, 6),
  },
  {
    label: "height iciness",
    color: [1, 1, 0] as Rgb,
    func: (t: number) => smoothstep(t ** 9),
  },
  {
    label: "height iciness piecewise",
    color: [0.7, 0.7, 0] as Rgb,
    func: (t: number) => piecewiseCurve(t, 0.95, 15),
  },
  {
    label: "sea depth",
    color: [0, 1, 0] as Rgb,
    func: (t: number) => smootherstep(t) * (1 - t) + t,
  },
  {
    label: "sea depth piecewise",
    color: [0, 0.7, 0] as Rgb,
    func: (t: number) => piecewiseCurve(t, 0.1, 3),
  },
  {
    label: "temperature desert",
    color: [1, 0, 0] as Rgb,
    func: (t: number) => smootherstep(t) ** 20,
  },
  {
    label: "temperature desert piecewise",
    color: [0.7, 0, 0] as Rgb,
    func: (t: number) => piecewiseCurve(t, 0.9, 8),
  },
  {
    label: "moisture desert",
    color: [0, 1, 1] as Rgb,
    func: (t: number) => smootherstep((1 - t ** 2) ** 20),
  },
  {
    label: "moisture desert piecewise",
    color: [0, 0.7, 0.7] as Rgb,
    func: (t: number) => 1 - piecewiseCurve(t, 0.1, 10),
  },
];

function piecewiseCurve(x: number, p: number, s: number): number {
  const c = s === 3 ? 0xffffffff : (1 - s) / (s - 3);

  if (x < p) {
    const n = x * (1 + c);
    const d = x + p * c;
    return x * (n / d) ** 2;
  } else {
    const v = 1 - x;
    const n = v * (1 + c);
    const d = v + (1 - p) * c;
    return 1 - v * (n / d) ** 2;
  }
}
</script>

<style scoped></style>
