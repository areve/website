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
        <div>weight: {{ universeLayer?.props.weight.toPrecision(3) }}</div>
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
        <div>weight: {{ galaxyLayer?.props.weight.toPrecision(3) }}</div>
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
        <div>weight: {{ solarSystemLayer?.props.weight.toPrecision(3) }}</div>
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
        <div>weight: {{ planetLayer?.props.weight.toPrecision(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw, watch } from "vue";
import {
  makeUniverseLayer,
  renderUniverse,
  UniverseLayer,
  UniverseProps,
} from "./maps/universeMap";
import {
  makePlanetMap,
  PlanetLayer,
  PlanetProps,
  renderPlanet,
} from "./maps/planetMap";
import { clamp } from "./lib/other";
import {
  GalaxyLayer,
  GalaxyProps,
  makeGalaxyLayer,
  renderGalaxy,
} from "./maps/galaxyMap";
import {
  SolarSystemLayer,
  SolarSystemProps,
  makeSolarSystemLayer,
  renderSolarSystem,
} from "./maps/solarSystemMap";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
const universeLayer = ref<UniverseLayer>();
const universeProps = ref<UniverseProps>();
const universeHover = ref(0);

const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
const galaxyLayer = ref<GalaxyLayer>();
const galaxyProps = ref<GalaxyProps>();
const galaxyHover = ref(0);

const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
const solarSystemLayer = ref<SolarSystemLayer>();
const solarSystemProps = ref<SolarSystemProps>();
const solarSystemHover = ref(0);

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
const planetLayer = ref<PlanetLayer>();
const planetProps = ref<PlanetProps>();

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  universeProps.value = {
    width: 256,
    height: 256,
    seed: new TextEncoder().encode("This is the seed"),
    weight: thisUniverseWeightKg,
  };
});

watch(universeProps, updateUniverseProps);
function updateUniverseProps(universeProps?: UniverseProps) {
  if (!universeProps) return;
  universeLayer.value = makeUniverseLayer(universeProps);
  universeContext =
    universeContext ??
    getContext(universeCanvas, universeProps.width, universeProps.height);
  renderUniverse(universeContext, universeLayer.value);
  updateGalaxy(0);
}

function updateGalaxy(coord: number) {
  if (!universeLayer.value) return;
  galaxyProps.value = {
    width: universeLayer.value.props.width,
    height: universeLayer.value.props.height,
    seed: universeLayer.value.states[coord],
    weight: universeLayer.value.weights[coord],
    universeProps: toRaw(universeLayer.value.props),
  };
}

watch(galaxyProps, updateGalaxyProps);
function updateGalaxyProps(galaxyProps?: GalaxyProps) {
  if (!galaxyProps) return;
  galaxyLayer.value = makeGalaxyLayer(galaxyProps);
  galaxyContext =
    galaxyContext ??
    getContext(galaxyCanvas, galaxyProps.width, galaxyProps.height);
  renderGalaxy(galaxyContext, galaxyLayer.value);
  updateSolarSystem(0);
}

function updateSolarSystem(coord: number) {
  if (!galaxyLayer.value) return;
  solarSystemProps.value = {
    width: galaxyLayer.value.props.width,
    height: galaxyLayer.value.props.height,
    seed: galaxyLayer.value.states[coord],
    weight: galaxyLayer.value.weights[coord],
    galaxyProps: toRaw(galaxyLayer.value.props),
  };
}

watch(solarSystemProps, updateSolarSystemProps);
function updateSolarSystemProps(solarSystemProps?: SolarSystemProps) {
  if (!solarSystemProps) return;
  solarSystemLayer.value = makeSolarSystemLayer(solarSystemProps);
  solarSystemContext =
    solarSystemContext ??
    getContext(
      solarSystemCanvas,
      solarSystemProps.width,
      solarSystemProps.height
    );
  renderSolarSystem(solarSystemContext, solarSystemLayer.value);
  updatePlanet(0);
}

function updatePlanet(coord: number) {
  if (!solarSystemLayer.value) return;
  planetProps.value = {
    width: solarSystemLayer.value.props.width,
    height: solarSystemLayer.value.props.height,
    seed: solarSystemLayer.value.states[coord],
    weight: solarSystemLayer.value.weights[coord],
    solarSystemProps: toRaw(solarSystemLayer.value.props),
  };
}

watch(planetProps, updatePlanetProps);
function updatePlanetProps(planetProps?: PlanetProps) {
  if (!planetProps) return;
  planetLayer.value = makePlanetMap(planetProps);
  planetContext =
    planetContext ??
    getContext(planetCanvas, planetProps.width, planetProps.height);
  renderPlanet(planetContext, planetLayer.value);
}

const coordFromEvent = (
  event: MouseEvent,
  dimensions: { width: number; height: number }
) => {
  return (
    Math.round(clamp(event.offsetY, 0, dimensions.height - 1)) *
      dimensions.width +
    Math.round(clamp(event.offsetX, 0, dimensions.width - 1))
  );
};

const hoverUniverse = (event: MouseEvent) => {
  if (!universeLayer.value) return;
  universeHover.value =
    universeLayer.value.weights[
      coordFromEvent(event, universeLayer.value.props)
    ];
};

const clickUniverse = (event: MouseEvent) => {
  if (!universeLayer.value) return;
  updateGalaxy(coordFromEvent(event, universeLayer.value.props));
};

const hoverGalaxy = (event: MouseEvent) => {
  if (!galaxyLayer.value) return;
  galaxyHover.value =
    galaxyLayer.value.weights[coordFromEvent(event, galaxyLayer.value.props)];
};

const clickGalaxy = (event: MouseEvent) => {
  if (!galaxyLayer.value) return;
  updateSolarSystem(coordFromEvent(event, galaxyLayer.value.props));
};

const hoverSolarSystem = (event: MouseEvent) => {
  if (!solarSystemLayer.value) return;
  solarSystemHover.value =
    solarSystemLayer.value.weights[
      coordFromEvent(event, solarSystemLayer.value.props)
    ];
};

const clickSolarSystem = (event: MouseEvent) => {
  if (!solarSystemLayer.value) return;
  updatePlanet(coordFromEvent(event, solarSystemLayer.value.props));
};

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
