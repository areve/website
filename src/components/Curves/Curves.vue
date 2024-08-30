<template>
  <section>
    <h1>Curves</h1>
    <p>
      I needed a curve for a program to map some colours. This lead me to a
      whole lot of learning about curves and splines. These are some experiments
      I created during that.
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

const funcs = [
  {
    label: "a custom smooth curve",
    color: [1, 1, 0],
    func: makeSmoothCurveFunction([
      { x: 0, y: 0 },
      { x: 0.3, y: 0.3 },
      { x: 0.65, y: 0.12 },
      { x: 0.85, y: 0.9 },
      { x: 1, y: 1 },
    ]),
  },
];
</script>

<style scoped></style>