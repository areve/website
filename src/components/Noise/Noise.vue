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

    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="fractalPixel"
      >Fractal
    </NoiseRender>
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="mandelbrotPixel"
      >Mandelbrot
    </NoiseRender>
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="juliaPixel"
      >Julia
    </NoiseRender>
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="newtonRaphsonPixel"
      >Newton Raphson
    </NoiseRender>
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="sierpinskiPixel"
      >Sierpinski
    </NoiseRender>
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="lorenzAttractorPixel"
      >Lorenz attractor
    </NoiseRender>
    <NoiseRender
      :dimensions="{ width: 500, height: 100 }"
      :pixel="trigonometryPixel"
      >Trigonometry (various options)
    </NoiseRender>
    <NoiseRender :dimensions="{ width: 500, height: 100 }" :pixel="graphPixel"
      >OpenSimplex + trigonometry
    </NoiseRender>
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
import { makeFractalNoiseGenerator } from "./noise/fractal";
import { makeNewtonRaphsonGenerator } from "./noise/newtonRaphson";
import { makeLorenzAttractorGenerator } from "./noise/lorenzAttractor";
import { makeTrigonometryGenerator } from "./noise/trigonometry";
import { makeGraphGenerator } from "./noise/graph";
import {
  makeJuliaGenerator,
  makeMandelbrotGenerator,
} from "./noise/mandelbrot";
import { makeSierpinskiGenerator } from "./noise/sierpinski";

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
  const n = valueGenerator(coord);
  return [n, n, n];
};

const perlinGenerator = makePerlinGenerator(seed);
const perlinPixel = (coord: Coord) => {
  const n = perlinGenerator(coord);
  return [n, n, n];
};

const openSimplexGenerator = makeOpenSimplexGenerator(seed);
const openSimplexPixel = (coord: Coord) => {
  const n = openSimplexGenerator(coord);
  return [n, n, n];
};

const worleyGenerator = makeWorleyNoiseGenerator(seed);
const worleyPixel = (coord: Coord) => {
  const n = worleyGenerator(coord);
  return [n, n, n];
};
const starfieldGenerator = makeWorleyNoiseGenerator(seed, 3, 8, 32);
const starfieldPixel = (coord: Coord) => {
  const n = (1 - starfieldGenerator(coord)) ** 16;
  return [n, n, n];
};

const fractalGenerator = makeFractalNoiseGenerator(seed);
const fractalPixel = (coord: Coord) => {
  const n = fractalGenerator(coord);
  return [n, n, n];
};

const mandelbrotGenerator = makeMandelbrotGenerator(seed);
const mandelbrotPixel = (coord: Coord) => {
  const n = mandelbrotGenerator(coord);
  return [n, n, n];
};
const juliaGenerator = makeJuliaGenerator(seed);
const juliaPixel = (coord: Coord) => {
  const n = juliaGenerator(coord);
  return hsv2rgb([0.9 - n * 0.7, 1 - n ** 0.5, n]);
};
const newtonRaphsonGenerator = makeNewtonRaphsonGenerator(seed);
const newtonRaphsonPixel = (coord: Coord) => {
  const n = newtonRaphsonGenerator(coord);
  return [n, n, n];
};
const lorenzAttractorGenerator = makeLorenzAttractorGenerator(seed);
const lorenzAttractorPixel = (coord: Coord) => {
  const n = lorenzAttractorGenerator(coord);
  return [n, n, n];
};

const sierpinskiGenerator = makeSierpinskiGenerator(seed);
const sierpinskiPixel = (coord: Coord) => {
  const n = sierpinskiGenerator(coord);
  return [n, n, n];
};
const trigonometryGenerator = makeTrigonometryGenerator(seed, "twirly");
const trigonometryPixel = (coord: Coord) => {
  const n = trigonometryGenerator(coord);
  return [n, n, n];
};
const graphGenerator = makeGraphGenerator(seed);
const graphPixel = (coord: Coord) => {
  const n = graphGenerator(coord);
  return hsv2rgb([n + 0.9, n ** 2, 1 - n * 0.9]);
};

type Rgb = [r: number, g: number, b: number];
type Hsv = [h: number, s: number, v: number];
function hsv2rgb(hsv: Hsv): Rgb {
  const [h, s, v] = hsv;
  const hue = (((h * 360) % 360) + 360) % 360;
  const sector = Math.floor(hue / 60);
  const sectorFloat = hue / 60 - sector;
  const x = v * (1 - s);
  const y = v * (1 - s * sectorFloat);
  const z = v * (1 - s * (1 - sectorFloat));
  const rgb = [x, x, z, v, v, y, x, x, z, v];
  return [rgb[sector + 4], rgb[sector + 2], rgb[sector]];
}
</script>

<style scoped></style>
