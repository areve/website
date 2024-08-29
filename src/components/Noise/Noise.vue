<template>
  <section>
    <h1>Noise</h1>
    <p>
      Whilst generating maps I looked at different ways to generate noise,
      splines and curves. This page shows what different algorithms look like
      and gives some indication of how fast they are.
    </p>
    <div
      v-for="noise in noises"
      :class="{
        selected: noise === selectedNoise,
      }"
      class="panel"
    >
      <NoiseRender
        :dimensions="noise.dimensions"
        :camera="noise.camera"
        :pixel="noise.pixel"
        :dirty="noise.dirty"
        @click="select(noise)"
        >{{ noise.title }}</NoiseRender
      >
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import NoiseRender from "./NoiseRender.vue";
import { Camera, Coord, Dimensions } from "./lib/interfaces";
import { makePointGenerator } from "./noise/prng";
import { makeValueNoiseGenerator } from "./noise/value";
import { makePerlinGenerator } from "./noise/perlin";
import { makeWorleyNoiseGenerator } from "./noise/worley";
import { makeOpenSimplexGenerator } from "./noise/openSimplex";
import { makeOpenSimplex3dGenerator } from "./noise/openSimplex3d";
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
const openSimplex3dGenerator = makeOpenSimplex3dGenerator(seed);
const openSimplex3dPixel = (coord: Coord) => {
  const n = openSimplex3dGenerator({ ...coord, z: liveSeed / 5});
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
let liveSeed = 0;
const juliaGenerator = makeJuliaGenerator(seed);
const juliaPixel = (coord: Coord) => {
  const v = juliaGenerator(coord);
  const n = v.iteration === v.maxIterations ? 1 : v.iteration / v.maxIterations;
  return hsv2rgb([liveSeed / 10 - n * 0.7, 1 - n ** 0.5, n]);
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

interface NoiseDefinition {
  dimensions: Dimensions;
  camera: Camera;
  title: string;
  dirty: number;
  pixel: (coord: Coord) => Rgb | number[];
}

const noises = ref<NoiseDefinition[]>([
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Value noise",
    pixel: valuePixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Pseudo-random pixels.",
    pixel: pseudoRandom,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Pseudo-random pixels in color.",
    pixel: pseudoRandomColor,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Perlin",
    pixel: perlinPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "OpenSimplex",
    pixel: openSimplexPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "OpenSimplex 3d",
    pixel: openSimplex3dPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Worley (Voronoi)",
    pixel: worleyPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Worley (Starfield)",
    pixel: starfieldPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Fractal",
    pixel: fractalPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Mandelbrot",
    pixel: mandelbrotPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Julia",
    pixel: juliaPixel,
    dirty: window.performance.now(),
  },

  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Newton Raphson",
    pixel: newtonRaphsonPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Sierpinski",
    pixel: sierpinskiPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Lorenz attractor",
    pixel: lorenzAttractorPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "Trigonometry (various options)",
    pixel: trigonometryPixel,
    dirty: window.performance.now(),
  },
  {
    dimensions: { width: 500, height: 100 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "OpenSimplex + trigonometry",
    pixel: graphPixel,
    dirty: window.performance.now(),
  },
]);

const selectedNoise = ref<NoiseDefinition>();
function select(noise: NoiseDefinition) {
  if (selectedNoise.value === noise) {
    selectedNoise.value = undefined;
    return;
  }
  selectedNoise.value = noise;
}

let interval: NodeJS.Timeout | undefined;
onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
  interval = setInterval(() => {
    liveSeed++;
    if (selectedNoise.value)
      selectedNoise.value.dirty = window.performance.now();
  }, 40);
});
onUnmounted(() => {
  if (interval) clearInterval(interval);
  interval = undefined;
});

const onKeyDown = (event: KeyboardEvent) => {
  if (!selectedNoise.value) return;
  const zoom = selectedNoise.value.camera.zoom;
  if (event.key === "a") selectedNoise.value.camera.x -= 25 * zoom;
  if (event.key === "d") selectedNoise.value.camera.x += 25 * zoom;
  if (event.key === "w") selectedNoise.value.camera.y -= 25 * zoom;
  if (event.key === "s") selectedNoise.value.camera.y += 25 * zoom;
  if (event.key === "'") selectedNoise.value.camera.zoom /= 1.2;
  if (event.key === "/") selectedNoise.value.camera.zoom *= 1.2;
  if (event.key === "t") selectedNoise.value.dimensions.height += 50;
  if (event.key === "g") selectedNoise.value.dimensions.height -= 50;
  if (event.key === "h") selectedNoise.value.dimensions.width += 50;
  if (event.key === "f") selectedNoise.value.dimensions.width -= 50;
  if (event.key === ".") {
    selectedNoise.value.dirty = window.performance.now();
  }
  if (selectedNoise.value.dimensions.height < 50)
    selectedNoise.value.dimensions.height = 50;
  if (selectedNoise.value.dimensions.width < 50)
    selectedNoise.value.dimensions.width = 50;
  console.log(event.key);
};
</script>

<style scoped>
.panel {
  padding: 0.5em;
}
.selected {
  background-color: rgba(0, 0, 255, 0.05);
  box-shadow: 0 0 1em rgba(0, 0, 127, 0.25);
}
</style>
