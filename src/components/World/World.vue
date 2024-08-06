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
import { Cells, getCells, xor } from "./lib/other";

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

  universeMap = makeUniverseMap(width, height, seed);
  renderUniverse(universeContext, universeMap.cellIntegers);

  planetMap = makePlanetMap(
    width,
    height,
    xor(universeMap.stats.layerState, universeMap.cellStates[0]),
    universeMap.cellWeights[0],
    universeMap.cellIntegers[0],
  );
  renderPlanet(planetContext, planetMap.cellIntegers);
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

const hoverUniverse = (event: MouseEvent) => {
  // console.log(hoverUniverse)
  const clickPoint = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = clickPoint.y * width + clickPoint.x;
  // console.log(clickPoint, universe.cellIntegers[coord] & 0xff);
  hover.value = (universeMap.cellIntegers[coord] / 0xffffffff) * 255;
};

const clickUniverse = (event: MouseEvent) => {
  const clickPoint = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = clickPoint.y * width + clickPoint.x;
  clickData.value = (universeMap.cellIntegers[coord] / 0xffffffff) * 255;
  // console.log(clickPoint, universe.cellIntegers[coord] & 0xff);

  // planet
  // const planet = getCells(
  //   xor(universeMap.stats.layerState, universeMap.cellStates[coord]),
  //   universeMap.cellWeights[coord]
  // );

  // const planetMap = makePlanetMap(
  //   planet.cellIntegers,
  //   universeMap.cellIntegers[coord]
  // );
  // renderPlanet(planetContext, planetMap);
  planetMap = makePlanetMap(
    width,
    height,
    xor(universeMap.stats.layerState, universeMap.cellStates[coord]),
    universeMap.cellWeights[coord],
    universeMap.cellIntegers[coord],
  );
  renderPlanet(planetContext, planetMap.cellIntegers);
};
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
