<template>
  <section>
    <h1>Noise</h1>
    <p>
      Whilst generating maps I looked at different ways to generate noise,
      splines and curves. This page shows what different algorithms look like
      and gives some indication of how fast they are.
    </p>

    <NoiseRender :dimensions="{ width: 500, height: 100 }">
      Random pixels (default)
    </NoiseRender>
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="randomPixel"
      >Random pixels, in grayscale.</NoiseRender
    >
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="pseudoRandom"
      >Pseudo-random pixels.</NoiseRender
    >
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="pseudoRandomColor"
      >Pseudo-random pixels.</NoiseRender
    >
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="perlinPixel"
      >Perlin</NoiseRender
    >
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="openSimplexPixel"
      >OpenSimplex</NoiseRender
    >
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="voronoiPixel"
      >Voronoi</NoiseRender
    >
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="smoothstepPixel"
      >Smoothstep</NoiseRender
    >
  </section>
</template>

<script lang="ts" setup>
import NoiseRender from "./NoiseRender.vue";
import { Coord } from "./lib/interfaces";
import { makePointGenerator } from "./noise/prng";
import { makePerlinNoiseGenerator } from "./noise/perlin";
import { makeOpenSimplexNoiseGenerator } from "./noise/openSimplex";
import { makeSmoothstepGenerator } from "./noise/smoothstep";
import { makeVoronoiNoiseGenerator } from "./noise/voronoi";

const seed = 12345;
const generator = makePointGenerator(seed);

const randomPixel = (coord: Coord) => {
  const n = Math.random();
  return [n, n, n];
};

const pseudoRandom = (coord: Coord) => {
  const n = generator(coord);
  return [n, n, n];
};

const pseudoRandomColor = (coord: Coord) => {
  return [
    generator({ x: coord.x, y: coord.y, z: 0 }),
    generator({ x: coord.x, y: coord.y, z: 1 }),
    generator({ x: coord.x, y: coord.y, z: 2 }),
  ];
};

const perlinGenerator = makePerlinNoiseGenerator(seed);
const perlinPixel = (coord: Coord) => {
  const s = { x: coord.x / 8, y: coord.y / 8 };
  const n = (perlinGenerator(s) + 1) / 2;
  return [n, n, n];
};

const openSimplexGenerator = makeOpenSimplexNoiseGenerator(seed);
const openSimplexPixel = (coord: Coord) => {
  const s = { x: coord.x / 6, y: coord.y / 6 };
  const n = (openSimplexGenerator(s) + 1) / 2;
  return [n, n, n];
};

const voronoiGenerator = makeVoronoiNoiseGenerator(seed);
const voronoiPixel = (coord: Coord) => {
  const s = { x: coord.x / 200, y: coord.y / 200 };
  const n = voronoiGenerator(s) * 3;
  return [n, n, n];
};

const smoothstepGenerator = makeSmoothstepGenerator(seed);
const smoothstepPixel = (coord: Coord) => {
  const n = smoothstepGenerator(coord, 4);
  return [n, n, n];
};
</script>

<style scoped></style>
