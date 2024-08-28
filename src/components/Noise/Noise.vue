<template>
  <section>
    <h1>Noise</h1>
    <p>
      Whilst generating maps I looked at different ways to generate noise,
      splines and curves. This page shows what different algorithms look like
      and gives some indication of how fast they are.
    </p>
    <!--  
    <NoiseRender :dimensions="{ width: 500, height: 100 }">
      Random pixels (default)
    </NoiseRender>
-->
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

    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="valuePixel"
      >Value noise</NoiseRender
    >
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="perlinPixel"
      >Perlin</NoiseRender
    >

    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="openSimplexPixel"
      >OpenSimplex</NoiseRender
    >

    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="worleyPixel"
      >Worley (Voronoi)</NoiseRender
    >

    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="starfieldPixel"
      >Worley (Starfield)</NoiseRender
    >
  </section>
</template>

<script lang="ts" setup>
import NoiseRender from "./NoiseRender.vue";
import { Coord } from "./lib/interfaces";
import { makePointGenerator } from "./noise/prng";
import { makeValueNoiseGenerator } from "./noise/value";
import { makePerlinGenerator } from "./noise/perlin";
import { makeWorleyNoiseGenerator } from "./noise/worley";
import { makeOpenSimplexGenerator } from "./noise/openSimplex";

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

const valueGenerator = makeValueNoiseGenerator(seed);
const valuePixel = (coord: Coord) => {
  const n = valueGenerator(coord, 8);
  return [n, n, n];
};

const perlinGenerator = makePerlinGenerator(seed);
const perlinPixel = (coord: Coord) => {
  const n = perlinGenerator(coord, 8) * 0.8 + 0.6;
  return [n, n, n];
};

const openSimplexGenerator = makeOpenSimplexGenerator(seed);
const openSimplexPixel = (coord: Coord) => {
  const n = openSimplexGenerator(coord, 8) + 0.5;
  return [n, n, n];
};

const worleyGenerator = makeWorleyNoiseGenerator(seed, 3, 8, 1);
const worleyPixel = (coord: Coord) => {
  const n = worleyGenerator(coord);
  return [n, n, n];
};
const starfieldGenerator = makeWorleyNoiseGenerator(
  seed,
  3,
  8,
  1,
  undefined,
  (v) => (1 - v ** 0.5) ** 16
);
const starfieldPixel = (coord: Coord) => {
  const n = starfieldGenerator(coord);
  return [n, n, n];
};
</script>

<style scoped></style>
