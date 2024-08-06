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
    <pre>{{ details }}</pre>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from "vue";
import { diskFilter } from "./filters/diskFilter";
import { PRNG } from "./lib/prng";
import { makeUniverseMap, renderUniverse } from "./maps/universeMap";
import { makePlanetMap, renderPlanet } from "./maps/planetMap";
import { Cells, getCells, xor } from "./lib/other";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
const planetCanvas = ref<HTMLCanvasElement>(undefined!);

const hover = ref(0.45);
const clickData = ref(0.45);
const details = ref("");

const seed = new TextEncoder().encode("This is the seed");

const width = 256;
const height = 256;

let universe: Cells;
const universeWeightKg = 1e53;
onMounted(async () => {
  let data: string[] = [];

  const coord = 100 * 100 + 127;

  // universe
  // galaxy
  // solar system
  // star
  // planet
  // continent
  // country
  // city
  // house

  universe = getCells(seed, universeWeightKg);
  data.push("universeWeight:" + universe.stats.totalWeight);
  data.push("cells1:" + universe.cellWeights[coord]);

  const universeMap = makeUniverseMap(universe.cellIntegers);

  details.value = data.join("\n");
  renderUniverse(getContext(universeCanvas), universeMap);
});

function getContext(canvas: Ref<HTMLCanvasElement>) {
  if (!canvas.value) return null;
  canvas.value.width = canvas.value.offsetWidth;
  canvas.value.height = canvas.value.offsetHeight;
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
  hover.value = (universe.cellIntegers[coord] / 0xffffffff) * 255;
};

const clickUniverse = (event: MouseEvent) => {
  const clickPoint = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = clickPoint.y * width + clickPoint.x;
  clickData.value = (universe.cellIntegers[coord] / 0xffffffff) * 255;
  // console.log(clickPoint, universe.cellIntegers[coord] & 0xff);

  // planet
  const planet = getCells(
    xor(universe.stats.layerState, universe.cellStates[coord]),
    universe.cellWeights[coord]
  );

  const planetMap = makePlanetMap(
    planet.cellIntegers,
    universe.cellIntegers[coord]
  );
  renderPlanet(getContext(planetCanvas), planetMap);
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