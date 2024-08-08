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
        <div>weight: {{ solarSystemMap?.props.weight.toPrecision(3) }}</div>
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
        <div>weight: {{ planetMap?.props.weight.toPrecision(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw, watch } from "vue";
import {
  makeUniverseMap,
  renderUniverse,
  UniverseMapData,
  UniverseProps,
} from "./maps/universeMap";
import {
  makePlanetMap,
  PlanetMapData,
  PlanetProps,
  renderPlanet,
} from "./maps/planetMap";
import { clamp } from "./lib/other";
import {
  GalaxyMapData,
  GalaxyProps,
  makeGalaxyMap,
  renderGalaxy,
} from "./maps/galaxyMap";
import {
  SolarSystemMapData,
  SolarSystemProps,
  makeSolarSystemMap,
  renderSolarSystem,
} from "./maps/solarSystemMap";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
const universeMap = ref<UniverseMapData>();
const universeSeedData = ref<UniverseProps>();
const universeHover = ref(0);

const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
const galaxyMap = ref<GalaxyMapData>();
const galaxySeedData = ref<GalaxyProps>();
const galaxyHover = ref(0);

const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
const solarSystemMap = ref<SolarSystemMapData>();
const solarSystemSeedData = ref<SolarSystemProps>();
const solarSystemHover = ref(0);

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
const planetMap = ref<PlanetMapData>();
const planetSeedData = ref<PlanetProps>();

const width = 256;
const height = 256;

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  universeSeedData.value = {
    width,
    height,
    seed: new TextEncoder().encode("This is the seed"),
    weight: thisUniverseWeightKg,
  };
});

watch(universeSeedData, updateUniverseSeedData);
function updateUniverseSeedData(universeSeedData?: UniverseProps) {
  if (!universeSeedData) return;
  universeMap.value = makeUniverseMap(universeSeedData);
  universeContext =
    universeContext ?? getContext(universeCanvas, width, height);
  renderUniverse(universeContext, universeMap.value);
  updateGalaxy(0);
}

function updateGalaxy(coord: number) {
  if (!universeMap.value) return;
  galaxySeedData.value = {
    width,
    height,
    seed: universeMap.value.states[coord],
    weight: universeMap.value.weights[coord],
    parentProps: toRaw(universeMap.value.props),
  };
}

watch(galaxySeedData, updateGalaxySeedData);
function updateGalaxySeedData(galaxySeedData?: GalaxyProps) {
  if (!galaxySeedData) return;
  galaxyMap.value = makeGalaxyMap(galaxySeedData);
  galaxyContext = galaxyContext ?? getContext(galaxyCanvas, width, height);
  renderGalaxy(galaxyContext, galaxyMap.value);
  updateSolarSystem(0);
}

function updateSolarSystem(coord: number) {
  if (!galaxyMap.value) return;
  solarSystemSeedData.value = {
    width,
    height,
    seed: galaxyMap.value.states[coord],
    weight: galaxyMap.value.weights[coord],
    parentProps: toRaw(galaxyMap.value.props),
  };
}

watch(solarSystemSeedData, updateSolarSystemSeedData);
function updateSolarSystemSeedData(solarSystemSeedData?: SolarSystemProps) {
  console.log("solarSystemSeedData", solarSystemSeedData?.seed);
  if (!solarSystemSeedData) return;
  solarSystemMap.value = makeSolarSystemMap(solarSystemSeedData);
  solarSystemContext =
    solarSystemContext ?? getContext(solarSystemCanvas, width, height);
  renderSolarSystem(solarSystemContext, solarSystemMap.value);
  updatePlanet(0);
}

function updatePlanet(coord: number) {
  if (!solarSystemMap.value) return;
  planetSeedData.value = {
    width,
    height,
    seed: solarSystemMap.value.props.seed,
    weight: solarSystemMap.value.weights[coord],
    parentProps: toRaw(solarSystemMap.value.props),
  };
}

watch(planetSeedData, updatePlanetSeedData);
function updatePlanetSeedData(planetSeedData?: PlanetProps) {
  if (!planetSeedData) return;
  planetMap.value = makePlanetMap(planetSeedData);
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
