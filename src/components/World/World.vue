<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>click the top map to see the detail</p>

    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="universeCanvas"
          class="canvas"
          @click="clickUniverse"
          @mousemove="hoverUniverse"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">universe</div>
        <div>each dot is a galaxy</div>
        <div>{{ universeHover.toFixed(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="galaxyCanvas"
          class="canvas"
          @click="clickGalaxy"
          @mousemove="hoverGalaxy"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">galaxy</div>
        <div>each dot is a solar system</div>
        <div>{{ galaxyData.toFixed(3) }}</div>
        <div>{{ galaxyHover.toFixed(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="solarSystemCanvas"
          class="canvas"
          @click="clickSolarSystem"
          @mousemove="hoverSolarSystem"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">solar system</div>
        <div>each dots is a sun, planet, moon, astroid</div>
        <div>{{ solarSystemData.toFixed(3) }}</div>
        <div>{{ solarSystemHover.toFixed(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas ref="planetCanvas" class="canvas"></canvas>
      </div>
      <div class="notes">
        <div>{{ planetData.toFixed(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from "vue";
import {
  makeUniverseMap,
  renderUniverse,
  UniverseMapData,
} from "./maps/universeMap";
import { makePlanetMap, PlanetMapData, renderPlanet } from "./maps/planetMap";
import { xor } from "./lib/other";
import { GalaxyMapData, makeGalaxyMap, renderGalaxy } from "./maps/galaxyMap";
import { SolarSystemMapData, makeSolarSystemMap, renderSolarSystem } from "./maps/solarSystemMap";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
let universeMap: UniverseMapData;

const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
let galaxyMap: GalaxyMapData;

const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
let solarSystemMap: SolarSystemMapData;

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
let planetMap: PlanetMapData;

const universeHover = ref(0);
const planetData = ref(0);
const galaxyHover = ref(0);
const galaxyData = ref(0);
const solarSystemHover = ref(0);
const solarSystemData = ref(0);

const seed = new TextEncoder().encode("This is the seed");

const width = 256;
const height = 256;

onMounted(async () => {
  universeContext = getContext(universeCanvas, width, height);
  galaxyContext = getContext(galaxyCanvas, width, height);
  solarSystemContext = getContext(solarSystemCanvas, width, height);
  planetContext = getContext(planetCanvas, width, height);

  const universeWeightKg = 1e53; // TODO will use this again later
  universeMap = makeUniverseMap(width, height, seed, universeWeightKg);
  renderUniverse(universeContext, universeMap);

  updateGalaxy(0);
  updateSolarSystem(0);
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

const hoverSolarSystem = (event: MouseEvent) => {
  // const point = {
  //   x: event.offsetX,
  //   y: event.offsetY,
  // };
  // const coord = point.y * width + point.x;
  // galaxyHover.value = (galaxyMap.weights[coord] / 0xffffffff) * 255;
};

const clickSolarSystem = (event: MouseEvent) => {
  // const point = {
  //   x: event.offsetX,
  //   y: event.offsetY,
  // };
  // const coord = point.y * width + point.x;

  // updatePlanet(coord);
  // planetData.value = (galaxyMap.weights[coord] / 0xffffffff) * 255;
};
const hoverGalaxy = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;
  galaxyHover.value = (galaxyMap.weights[coord] / 0xffffffff) * 255;
};

const clickGalaxy = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;

  updateSolarSystem(coord);
  solarSystemData.value = (galaxyMap.weights[0] / 0xffffffff) * 255;

  updatePlanet(0);
  planetData.value = (solarSystemMap.weights[0] / 0xffffffff) * 255;
};

const hoverUniverse = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;
  universeHover.value = (universeMap.weights[coord] / 0xffffffff) * 255;
};

const clickUniverse = (event: MouseEvent) => {
  const point = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = point.y * width + point.x;

  updateGalaxy(coord);
  galaxyData.value = (universeMap.weights[coord] / 0xffffffff) * 255;

  updateSolarSystem(0);
  solarSystemData.value = (galaxyMap.weights[0] / 0xffffffff) * 255;

  updatePlanet(0);
  planetData.value = (solarSystemMap.weights[0] / 0xffffffff) * 255;
};

function updateGalaxy(coord: number) {
  galaxyMap = makeGalaxyMap(
    width,
    height,
    xor(universeMap.state, universeMap.states[coord]),
    universeMap.weights[coord]
  );
  renderGalaxy(galaxyContext, galaxyMap);
}
function updateSolarSystem(coord: number) {
  solarSystemMap = makeSolarSystemMap(
    width,
    height,
    xor(galaxyMap.state, galaxyMap.states[coord]),
    galaxyMap.weights[coord]
  );
  renderSolarSystem(solarSystemContext, solarSystemMap);
}
function updatePlanet(coord: number) {
  planetMap = makePlanetMap(
    width,
    height,
    xor(universeMap.state, universeMap.states[coord]),
    universeMap.weights[coord]
  );
  renderPlanet(planetContext, planetMap);
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
.group {
  display: flex;
  margin-bottom: 5px;
}
.title {
  font-weight: 500;
}
.notes {
  flex: 1 1;
  /* border: 1px solid red; */
  background-color: #eee;
  margin-left: 5px;
  padding: 5px;
}
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
