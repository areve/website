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
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="perlin2Pixel"
      >Perlin</NoiseRender
    >

    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="openSimplex2Pixel"
      >OpenSimplex2 (WIP)</NoiseRender
    >
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="openSimplexPixel"
      >OpenSimplex</NoiseRender
    >

    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="voronoi2Pixel"
      >Voronoi</NoiseRender
    >

    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="starfieldPixel"
      >Starfield</NoiseRender
    >
  </section>
</template>

<script lang="ts" setup>
import NoiseRender from "./NoiseRender.vue";
import { Coord } from "./lib/interfaces";
import { makePointGenerator } from "./noise/prng";
import { makeOpenSimplexNoiseGenerator } from "./noise/openSimplex";
import { makeValueNoiseGenerator } from "./noise/value";
import { makePerlin2Generator } from "./noise/perlin2";
import { makeVoronoi2NoiseGenerator } from "./noise/voronoi2";
import { makeStarfieldGenerator } from "./noise/starfield";
import { makeOpenSimplex2Generator } from "./noise/openSimplex2";

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

const openSimplexGenerator = makeOpenSimplexNoiseGenerator(seed);
const openSimplexPixel = (coord: Coord) => {
  const s = { x: coord.x / 6, y: coord.y / 6 };
  const n = (openSimplexGenerator(s) + 1) / 2;
  return [n, n, n];
};

const valueGenerator = makeValueNoiseGenerator(seed);
const valuePixel = (coord: Coord) => {
  const n = valueGenerator(coord, 8);
  return [n, n, n];
};

const perlin2Generator = makePerlin2Generator(seed);
const perlin2Pixel = (coord: Coord) => {
  const n = perlin2Generator(coord, 8) * 0.8 + 0.6;
  return [n, n, n];
};
const openSimplex2Generator = makeOpenSimplex2Generator(seed);
const openSimplex2Pixel = (coord: Coord) => {
  const n = openSimplex2Generator(coord, 8) * 0.5 + 0.5;
  return [n, n, n];
};

const voronoi2Generator = makeVoronoi2NoiseGenerator(seed, 3, 16, 6);
const voronoi2Pixel = (coord: Coord) => {
  const n = voronoi2Generator(coord) * 2;
  return [n, n, n];
};
const starfieldGenerator = makeStarfieldGenerator(seed);
const starfieldPixel = (coord: Coord) => {
  const n = starfieldGenerator(coord);
  return [n, n, n];
};
</script>

<style scoped></style>
./noise/value
