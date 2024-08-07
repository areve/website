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
        <div class="info">each dot is a galaxy</div>
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
        <div class="info">each dot is a solar system</div>
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
        <div class="info">each dot is a sun, planet, moon, astroid</div>
        <div>{{ solarSystemData.toFixed(3) }}</div>
        <div>{{ solarSystemHover.toFixed(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas ref="planetCanvas" class="canvas"></canvas>
      </div>
      <div class="notes">
        <div class="title">planet</div>
        <div class="info">each dot is a point on a point on the planet sized region of the solar system</div>
        <div>{{ planetData.toFixed(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, watch } from "vue";
import {
  makeUniverseMap,
  renderUniverse,
  UniverseMapData,
} from "./maps/universeMap";
import { makePlanetMap, PlanetMapData, renderPlanet } from "./maps/planetMap";
import { xor } from "./lib/other";
import { GalaxyMapData, makeGalaxyMap, renderGalaxy } from "./maps/galaxyMap";
import {
  SolarSystemMapData,
  makeSolarSystemMap,
  renderSolarSystem,
} from "./maps/solarSystemMap";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
let universeMap: UniverseMapData;
interface UniverseSeedData {
  seed: Uint8Array;
  weight: number;
}
const universeSeedData = ref<UniverseSeedData>();
const universeHover = ref(0);

const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
let galaxyMap: GalaxyMapData;
interface GalaxySeedData {
  seed: Uint8Array;
  weight: number;
}
const galaxySeedData = ref<GalaxySeedData>();
const galaxyHover = ref(0);
const galaxyData = ref(0);

const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
let solarSystemMap: SolarSystemMapData;
interface SolarSystemSeedData {
  seed: Uint8Array;
  weight: number;
}
const solarSystemSeedData = ref<SolarSystemSeedData>();
const solarSystemHover = ref(0);
const solarSystemData = ref(0);

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
let planetMap: PlanetMapData;
interface PlanetSeedData {
  seed: Uint8Array;
  weight: number;
}
const planetSeedData = ref<PlanetSeedData>();
const planetData = ref(0);

const width = 256;
const height = 256;

onMounted(async () => {
  const universeWeightKg = 1e53;
  universeSeedData.value = {
    seed: new TextEncoder().encode("This is the seed"),
    weight: universeWeightKg,
  };
});

watch(universeSeedData, updateUniverseSeedData);
function updateUniverseSeedData(universeSeedData?: UniverseSeedData) {
  if (!universeSeedData) return;
  universeMap = makeUniverseMap(
    width,
    height,
    universeSeedData.seed,
    universeSeedData.weight
  );
  universeContext =
    universeContext ?? getContext(universeCanvas, width, height);
  renderUniverse(universeContext, universeMap);
  updateGalaxy(0);
}

function updateGalaxy(coord: number) {
  galaxySeedData.value = {
    seed: xor(universeMap.state, universeMap.states[coord]),
    weight: universeMap.weights[coord],
  };
}

watch(galaxySeedData, updateGalaxySeedData);
function updateGalaxySeedData(galaxySeedData?: GalaxySeedData) {
  if (!galaxySeedData) return;
  galaxyData.value = (galaxySeedData.weight / 0xffffffff) * 255;
  galaxyMap = makeGalaxyMap(
    width,
    height,
    galaxySeedData.seed,
    galaxySeedData.weight
  );
  galaxyContext = galaxyContext ?? getContext(galaxyCanvas, width, height);
  renderGalaxy(galaxyContext, galaxyMap);
  updateSolarSystem(0);
}

function updateSolarSystem(coord: number) {
  solarSystemSeedData.value = {
    seed: xor(galaxyMap.state, galaxyMap.states[coord]),
    weight: galaxyMap.weights[coord],
  };
}

watch(solarSystemSeedData, updateSolarSystemSeedData);
function updateSolarSystemSeedData(solarSystemSeedData?: SolarSystemSeedData) {
  if (!solarSystemSeedData) return;
  solarSystemData.value = (solarSystemSeedData.weight / 0xffffffff) * 255;
  solarSystemMap = makeSolarSystemMap(
    width,
    height,
    solarSystemSeedData.seed,
    solarSystemSeedData.weight
  );
  solarSystemContext =
    solarSystemContext ?? getContext(solarSystemCanvas, width, height);
  renderSolarSystem(solarSystemContext, solarSystemMap);
  updatePlanet(0);
}

function updatePlanet(coord: number) {
  planetSeedData.value = {
    seed: xor(solarSystemMap.state, solarSystemMap.states[coord]),
    weight: solarSystemMap.weights[coord],
  };
}

watch(planetSeedData, updatePlanetSeedData);
function updatePlanetSeedData(planetSeedData?: PlanetSeedData) {
  if (!planetSeedData) return;
  planetData.value = (planetSeedData.weight / 0xffffffff) * 255;
  planetMap = makePlanetMap(
    width,
    height,
    planetSeedData.seed,
    planetSeedData.weight
  );
  planetContext = planetContext ?? getContext(planetCanvas, width, height);
  renderPlanet(planetContext, planetMap);
}

const coordFromEvent = (event: MouseEvent) =>
  event.offsetY * width + event.offsetX;

const hoverUniverse = (event: MouseEvent) =>
  (universeHover.value =
    (universeMap.weights[coordFromEvent(event)] / 0xffffffff) * 255);

const clickUniverse = (event: MouseEvent) =>
  updateGalaxy(coordFromEvent(event));

const hoverGalaxy = (event: MouseEvent) =>
  (galaxyHover.value =
    (galaxyMap.weights[coordFromEvent(event)] / 0xffffffff) * 255);

const clickGalaxy = (event: MouseEvent) =>
  updateSolarSystem(coordFromEvent(event));

const hoverSolarSystem = (event: MouseEvent) =>
  (solarSystemHover.value =
    (solarSystemMap.weights[coordFromEvent(event)] / 0xffffffff) * 255);

const clickSolarSystem = (event: MouseEvent) =>
  updatePlanet(coordFromEvent(event));

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
.info {
  font-size: 0.9em;
  line-height: 1.2em;
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
