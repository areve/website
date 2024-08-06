<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>click the top map to see the detail</p>

    <div class="canvas-wrap">
      <canvas
        ref="universeCanvas"
        class="canvas"
        @click="clickUniverse"
        @mousemove="hoverUniverse"
      ></canvas>
    </div>
    <div>{{ Math.floor(hover) }}</div>
    <div>{{ Math.floor(clickData) }}</div>
    <div class="canvas-wrap">
      <canvas ref="planetCanvas" class="canvas"></canvas>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from "vue";
import { makeUniverseMap, renderUniverse } from "./maps/universeMap";
import { makePlanetMap, renderPlanet } from "./maps/planetMap";
import { Cells, xor } from "./lib/other";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
let universeMap: Cells;

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
let planetMap: Cells;

const hover = ref(0.45);
const clickData = ref(0.45);

const seed = new TextEncoder().encode("This is the seed");

const width = 256;
const height = 256;

onMounted(async () => {
  universeContext = getContext(universeCanvas, width, height);
  planetContext = getContext(planetCanvas, width, height);

  const universeWeightKg = 1e53; // TODO will use this again later
  universeMap = makeUniverseMap(width, height, seed, universeWeightKg);
  renderUniverse(universeContext, universeMap.cellIntegers);

  updatePlanet(0);

  // Hierachy is approximately
  // universe
  // galaxy
  // solar system
  // star
  // planet
  // continent
  // country
  // city
  // house
});

const hoverUniverse = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;
  hover.value = (universeMap.cellIntegers[coord] / 0xffffffff) * 255;
};

const clickUniverse = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;
  clickData.value = (universeMap.cellIntegers[coord] / 0xffffffff) * 255;
  updatePlanet(coord);
};

function updatePlanet(coord: number) {
  planetMap = makePlanetMap(
    width,
    height,
    xor(universeMap.stats.layerState, universeMap.cellStates[coord]),
    universeMap.cellIntegers[coord]
  );
  renderPlanet(planetContext, planetMap.cellIntegers);
}

function getContext(
  canvas: Ref<HTMLCanvasElement>,
  width: number,
  height: number
) {
  if (!canvas.value) return null;
  canvas.value.width = width;
  canvas.value.height = height;
  return canvas.value.getContext("2d", {
    willReadFrequently: true,
  });
}
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  height: 256px;
  width: 256px;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>
./maps/planetMap
