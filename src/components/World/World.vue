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
        <hr />
        <div>weight: {{ universeMap?.props.weight.toPrecision(3) }}</div>
        <div>{{ universeHover.toPrecision(3) }}</div>
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
        <hr />
        <div>weight: {{ galaxyMap?.props.weight.toPrecision(3) }}</div>
        <div>{{ galaxyHover.toPrecision(3) }}</div>
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
        <hr />
        <div>weight: {{ solarSystemMap?.weight.toPrecision(3) }}</div>
        <div>{{ solarSystemHover.toPrecision(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas ref="planetCanvas" class="canvas"></canvas>
      </div>
      <div class="notes">
        <div class="title">planet</div>
        <div class="info">
          each dot is a point on a point on the planet sized region of the solar
          system
        </div>
        <hr />
        <div>weight: {{ planetMap?.weight.toPrecision(3) }}</div>
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
UniverseMapDataProps,
} from "./maps/universeMap";
import { makePlanetMap, PlanetMapData, renderPlanet } from "./maps/planetMap";
import { clamp } from "./lib/other";
import { GalaxyMapData, makeGalaxyMap, renderGalaxy } from "./maps/galaxyMap";
import {
  SolarSystemMapData,
  makeSolarSystemMap,
  renderSolarSystem,
} from "./maps/solarSystemMap";

interface UniverseSeedData {
  seed: Uint8Array;
  weight: number;
}
const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
const universeMap = ref<UniverseMapData>();
const universeSeedData = ref<UniverseSeedData>();
const universeHover = ref(0);

interface GalaxySeedData {
  seed: Uint8Array;
  weight: number;
  parentProps: UniverseMapDataProps;
}
const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
const galaxyMap = ref<GalaxyMapData>();
const galaxySeedData = ref<GalaxySeedData>();
const galaxyHover = ref(0);

interface SolarSystemSeedData {
  seed: Uint8Array;
  weight: number;
}
const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
const solarSystemMap = ref<SolarSystemMapData>();
const solarSystemSeedData = ref<SolarSystemSeedData>();
const solarSystemHover = ref(0);

interface PlanetSeedData {
  seed: Uint8Array;
  weight: number;
}
const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
const planetMap = ref<PlanetMapData>();
const planetSeedData = ref<PlanetSeedData>();

const width = 256;
const height = 256;

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  universeSeedData.value = {
    seed: new TextEncoder().encode("This is the seed"),
    weight: thisUniverseWeightKg,
  };
});

watch(universeSeedData, updateUniverseSeedData);
function updateUniverseSeedData(universeSeedData?: UniverseSeedData) {
  if (!universeSeedData) return;
  universeMap.value = makeUniverseMap(
    width,
    height,
    universeSeedData.seed,
    universeSeedData.weight
  );
  universeContext =
    universeContext ?? getContext(universeCanvas, width, height);
  renderUniverse(universeContext, universeMap.value);
  updateGalaxy(0);
}

function updateGalaxy(coord: number) {
  if (!universeMap.value) return;
  galaxySeedData.value = {
    seed: universeMap.value.states[coord],
    weight: universeMap.value.weights[coord],
    parentProps: universeMap.value.props,
  };
}

watch(galaxySeedData, updateGalaxySeedData);
function updateGalaxySeedData(galaxySeedData?: GalaxySeedData) {
  if (!galaxySeedData) return;
  galaxyMap.value = makeGalaxyMap(
    width,
    height,
    galaxySeedData.seed,
    galaxySeedData.weight,
    galaxySeedData.parentProps
  );
  galaxyContext = galaxyContext ?? getContext(galaxyCanvas, width, height);
  renderGalaxy(galaxyContext, galaxyMap.value);
  updateSolarSystem(0);
}

function updateSolarSystem(coord: number) {
  if (!galaxyMap.value) return;
  solarSystemSeedData.value = {
    seed: galaxyMap.value.props.seed,
    weight: galaxyMap.value.weights[coord],
  };
}

watch(solarSystemSeedData, updateSolarSystemSeedData);
function updateSolarSystemSeedData(solarSystemSeedData?: SolarSystemSeedData) {
  if (!solarSystemSeedData) return;
  solarSystemMap.value = makeSolarSystemMap(
    width,
    height,
    solarSystemSeedData.seed,
    solarSystemSeedData.weight
  );
  solarSystemContext =
    solarSystemContext ?? getContext(solarSystemCanvas, width, height);
  renderSolarSystem(solarSystemContext, solarSystemMap.value);
  updatePlanet(0);
}

function updatePlanet(coord: number) {
  if (!solarSystemMap.value) return;
  planetSeedData.value = {
    seed: solarSystemMap.value.props.seed,
    weight: solarSystemMap.value.weights[coord],
  };
}

watch(planetSeedData, updatePlanetSeedData);
function updatePlanetSeedData(planetSeedData?: PlanetSeedData) {
  if (!planetSeedData) return;
  planetMap.value = makePlanetMap(
    width,
    height,
    planetSeedData.seed,
    planetSeedData.weight
  );
  planetContext = planetContext ?? getContext(planetCanvas, width, height);
  renderPlanet(planetContext, planetMap.value);
}

const coordFromEvent = (event: MouseEvent) => {
  return (
    Math.round(clamp(event.offsetY, 0, height - 1)) * width +
    Math.round(clamp(event.offsetX, 0, width - 1))
  );
};

const hoverUniverse = (event: MouseEvent) => {
  if (!universeMap.value) return;
  universeHover.value = universeMap.value.weights[coordFromEvent(event)];
};

const clickUniverse = (event: MouseEvent) =>
  updateGalaxy(coordFromEvent(event));

const hoverGalaxy = (event: MouseEvent) => {
  if (!galaxyMap.value) return;
  galaxyHover.value = galaxyMap.value.weights[coordFromEvent(event)];
};

const clickGalaxy = (event: MouseEvent) =>
  updateSolarSystem(coordFromEvent(event));

const hoverSolarSystem = (event: MouseEvent) => {
  if (!solarSystemMap.value) return;
  solarSystemHover.value = solarSystemMap.value.weights[coordFromEvent(event)];
};

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
