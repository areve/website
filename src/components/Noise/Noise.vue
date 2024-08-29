<template>
  <section>
    <h1>Noise</h1>
    <p>
      Whilst generating maps I looked at different ways to generate noise,
      splines and curves. This page shows what different algorithms look like
      and gives some indication of how fast they are.
    </p>
    <p>
      Key board shortcuts include W A S D, T F G H, ' / use Ctrl+click to
      multi-select
    </p>
    <div class="panels">
      <div
        v-for="noise in noises"
        :class="{
          selected: noise.selected,
        }"
        class="panel"
      >
        <NoiseRender
          :dimensions="noise.dimensions"
          :camera="noise.camera"
          :pixel="noise.pixel"
          :frame="noise.frame"
          @click="select(noise, $event)"
          >{{ noise.title }}</NoiseRender
        >
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import NoiseRender from "./NoiseRender.vue";
import { Camera, Dimensions } from "./lib/interfaces";
import { hsv2rgb, Rgb } from "./lib/other";
import { makeNoiseGenerator } from "./noise/prng";
import { makeValueNoiseGenerator } from "./noise/value";
import { makePerlinGenerator } from "./noise/perlin";
import { makeWorleyNoiseGenerator } from "./noise/worley";
import {
  makeOpenSimplex2dGenerator,
  makeOpenSimplex3dGenerator,
} from "./noise/openSimplex";
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
const noise = makeNoiseGenerator(seed);

const pseudoRandom = (x: number, y: number): Rgb => {
  const n = noise(x, y);
  return [n, n, n];
};

const pseudoRandomColor = (x: number, y: number): Rgb => {
  return [noise(x, y, 0), noise(x, y, 1), noise(x, y, 2)];
};

const valueGenerator = makeValueNoiseGenerator(seed);
const valuePixel = (x: number, y: number): Rgb => {
  const n = valueGenerator(x, y);
  return [n, n, n];
};

const perlinGenerator = makePerlinGenerator(seed);
const perlinPixel = (x: number, y: number): Rgb => {
  const n = perlinGenerator(x, y);
  return [n, n, n];
};

const openSimplexGenerator = makeOpenSimplex2dGenerator(seed);
const openSimplexPixel = (x: number, y: number): Rgb => {
  const n = openSimplexGenerator(x, y);
  return [n, n, n];
};

const openSimplex3dGenerator = makeOpenSimplex3dGenerator(seed);
const openSimplex3dPixel = (x: number, y: number): Rgb => {
  const n = openSimplex3dGenerator(x, y, openSimplex3d.frame / 5);
  return [n, n, n];
};
const openSimplex3d = {
  dimensions: { width: 300, height: 300 },
  camera: { x: 0, y: 0, zoom: 1 },
  title: "OpenSimplex 3d",
  pixel: openSimplex3dPixel,
  frame: 0,
  selected: false,
};

const worleyGenerator = makeWorleyNoiseGenerator(seed);
const worleyPixel = (x: number, y: number): Rgb => {
  const n = worleyGenerator(x, y);
  let c = worley.frame / 1000;
  c = c - (c | 0);
  return hsv2rgb([c, 1 - n ** 0.5, n]);
};
const worley = {
  dimensions: { width: 300, height: 300 },
  camera: { x: 0, y: 0, zoom: 1 },
  title: "Worley (Voronoi)",
  pixel: worleyPixel,
  frame: 0,
  selected: false,
};

const starfieldGenerator = makeWorleyNoiseGenerator(seed, 3, 8, 32);
const starfieldPixel = (x: number, y: number): Rgb => {
  const n = (1 - starfieldGenerator(x, y)) ** 16;
  return [n, n, n];
};

const fractalGenerator = makeFractalNoiseGenerator(seed);
const fractalPixel = (x: number, y: number): Rgb => {
  const n = fractalGenerator(x, y, fractal.frame / 3);
  return [n, n, n];
};
const fractal = {
  dimensions: { width: 300, height: 300 },
  camera: { x: 0, y: 0, zoom: 1 },
  title: "Fractal",
  pixel: fractalPixel,
  frame: 0,
  selected: false,
};

const mandelbrotGenerator = makeMandelbrotGenerator(seed);
const mandelbrotPixel = (x: number, y: number): Rgb => {
  const n = mandelbrotGenerator(x, y);
  return [n, n, n];
};

const juliaGenerator = makeJuliaGenerator(seed);
const juliaPixel = (x: number, y: number): Rgb => {
  const v = juliaGenerator(x, y);
  const n = v.iteration === v.maxIterations ? 1 : v.iteration / v.maxIterations;
  return hsv2rgb([julia.frame / 1000 - n * 0.7, 1 - n ** 0.5, n]);
};
const julia = {
  dimensions: { width: 300, height: 300 },
  camera: { x: 0, y: 0, zoom: 1 },
  title: "Julia",
  pixel: juliaPixel,
  frame: 0,
  selected: false,
};
const newtonRaphsonGenerator = makeNewtonRaphsonGenerator(seed);
const newtonRaphsonPixel = (x: number, y: number): Rgb => {
  const n = newtonRaphsonGenerator(x, y);
  return [n, n, n];
};
const lorenzAttractorGenerator = makeLorenzAttractorGenerator(seed);
const lorenzAttractorPixel = (x: number, y: number): Rgb => {
  const n = lorenzAttractorGenerator(x, y);
  return [n, n, n];
};

const sierpinskiGenerator = makeSierpinskiGenerator(seed);
const sierpinskiPixel = (x: number, y: number): Rgb => {
  const n = sierpinskiGenerator(x, y);
  return [n, n, n];
};
const trigonometryGenerator = makeTrigonometryGenerator(seed, "twirly");
const trigonometryPixel = (x: number, y: number): Rgb => {
  const n = trigonometryGenerator(x, y);
  return [n, n, n];
};
const graphGenerator = makeGraphGenerator(seed);
const graphPixel = (x: number, y: number) => {
  const n = graphGenerator(x, y, graph.frame / 10);
  return hsv2rgb([n + 0.9, n ** 2, 1 - n * 0.9]);
};
const graph = {
  dimensions: { width: 300, height: 300 },
  camera: { x: 0, y: 0, zoom: 1 },
  title: "OpenSimplex + trigonometry",
  pixel: graphPixel,
  frame: 0,
  selected: false,
};

interface NoiseDefinition {
  dimensions: Dimensions;
  camera: Camera;
  title: string;
  pixel: (x: number, y: number) => Rgb;
  frame: number;
  selected: boolean;
}

const noises = ref<NoiseDefinition[]>([
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Value noise",
    pixel: valuePixel,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Pseudo-random pixels.",
    pixel: pseudoRandom,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Pseudo-random pixels in color.",
    pixel: pseudoRandomColor,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Perlin",
    pixel: perlinPixel,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "OpenSimplex",
    pixel: openSimplexPixel,
    frame: 0,
    selected: false,
  },
  openSimplex3d,
  worley,
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Worley (Starfield)",
    pixel: starfieldPixel,
    frame: 0,
    selected: false,
  },
  fractal,
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Mandelbrot",
    pixel: mandelbrotPixel,
    frame: 0,
    selected: false,
  },
  julia,

  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Newton Raphson",
    pixel: newtonRaphsonPixel,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Sierpinski",
    pixel: sierpinskiPixel,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Lorenz attractor",
    pixel: lorenzAttractorPixel,
    frame: 0,
    selected: false,
  },
  {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Trigonometry (various options)",
    pixel: trigonometryPixel,
    frame: 0,
    selected: false,
  },
  graph,
]);

function select(noise: NoiseDefinition, event: MouseEvent) {
  if (!event.ctrlKey) {
    const selectedOthers = noises.value.filter(
      (v) => v.selected && v !== noise
    );
    selectedOthers.forEach((v) => (v.selected = false));
  }
  noise.selected = !noise.selected;
}

let frameId: number | null = null;

const update = () => {
  noises.value.filter((v) => v.selected).forEach((v) => ++v.frame);
  frameId = requestAnimationFrame(update);
};

onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
  update();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
  if (frameId) cancelAnimationFrame(frameId);
  frameId = null;
});

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "a" && event.ctrlKey)
    return noises.value.forEach((v) => (v.selected = true));

  noises.value
    .filter((v) => v.selected)
    .forEach((v) => {
      const zoom = v.camera.zoom;
      if (event.key === "a") v.camera.x -= 25 * zoom;
      if (event.key === "d") v.camera.x += 25 * zoom;
      if (event.key === "w") v.camera.y -= 25 * zoom;
      if (event.key === "s") v.camera.y += 25 * zoom;
      if (event.key === "'") v.camera.zoom /= 1.2;
      if (event.key === "/") v.camera.zoom *= 1.2;
      if (event.key === "t") v.dimensions.height += 50;
      if (event.key === "g") v.dimensions.height -= 50;
      if (event.key === "h") v.dimensions.width += 50;
      if (event.key === "f") v.dimensions.width -= 50;
      if (v.dimensions.height < 50) v.dimensions.height = 50;
      if (v.dimensions.width < 50) v.dimensions.width = 50;
    });

  console.log(event.key);
};
</script>

<style>
body {
  margin: 3em 0;
  max-width: none;
}

#app {
  width: 90%;
  margin: auto;
  user-select: none;
}
</style>
<style scoped>
.panels {
  display: flex;
  flex-wrap: wrap;
}
.panel {
  padding: 0.25em;
  margin: 0.25em;
  width: min-content;
}
.selected {
  background-color: rgba(0, 0, 255, 0.05);
  box-shadow: inset 0 0 1em rgba(0, 0, 127, 0.25);
}
</style>
