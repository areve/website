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
        <div>weight: {{ universeProps?.weight.toPrecision(3) }}</div>
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
        <div>weight: {{ galaxyProps?.weight.toPrecision(3) }}</div>
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
        <div class="info">each dot is a sun, planet, moon, asteroid</div>
        <hr />
        <div>weight: {{ solarSystemProps?.weight.toPrecision(3) }}</div>
        <div>{{ solarSystemHover.toPrecision(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="planetCanvas"
          class="canvas"
          @mousemove="hoverPlanet"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">planet</div>
        <div class="info">
          each dot is a point on a point on the planet sized region of the solar
          system
        </div>
        <hr />
        <div>weight: {{ planetProps?.weight.toPrecision(3) }}</div>
        <div>{{ planetHover.toPrecision(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw, watch } from "vue";
import { Layer } from "./lib/prng";
import {
  makeUniverseLayer,
  UniverseLayer,
  UniverseProps,
} from "./maps/universeMap";
import { makePlanetLayer, PlanetLayer, PlanetProps } from "./maps/planetMap";
import { clamp } from "./lib/other";
import { GalaxyLayer, GalaxyProps, makeGalaxyLayer } from "./maps/galaxyMap";
import {
  SolarSystemLayer,
  SolarSystemProps,
  makeSolarSystemLayer,
} from "./maps/solarSystemMap";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
let universeContext: CanvasRenderingContext2D | null;
let universeLayer: UniverseLayer;
const universeProps = ref<UniverseProps>();
const universeHover = ref(0);

const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
let galaxyContext: CanvasRenderingContext2D | null;
let galaxyLayer: GalaxyLayer;
const galaxyProps = ref<GalaxyProps>();
const galaxyHover = ref(0);

const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
let solarSystemContext: CanvasRenderingContext2D | null;
let solarSystemLayer: SolarSystemLayer;
const solarSystemProps = ref<SolarSystemProps>();
const solarSystemHover = ref(0);

const planetCanvas = ref<HTMLCanvasElement>(undefined!);
let planetContext: CanvasRenderingContext2D | null;
let planetLayer: PlanetLayer;
const planetProps = ref<PlanetProps>();
const planetHover = ref(0);

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  universeProps.value = {
    width: 200,
    height: 200,
    seed: 1234567890,
    weight: thisUniverseWeightKg,
  };
});

watch(universeProps, updateUniverseProps);
function updateUniverseProps(universeProps?: UniverseProps) {
  if (!universeProps) return;
  universeLayer = makeUniverseLayer(universeProps);
  universeContext ??= getContext(universeCanvas, universeProps);
  render(universeContext, universeLayer);
  updateGalaxy(0);
}

function updateGalaxy(coord: number) {
  if (!universeLayer) return;
  const width = coord % 200;
  const height = (coord / 200) % 200;
  galaxyProps.value = {
    width: universeLayer.props.width,
    height: universeLayer.props.height,
    seed: universeLayer.weights(width, height),
    weight: universeLayer.weights(width, height),
    universeProps: toRaw(universeLayer.props),
  };
}

watch(galaxyProps, updateGalaxyProps);
function updateGalaxyProps(galaxyProps?: GalaxyProps) {
  if (!galaxyProps) return;
  galaxyLayer = makeGalaxyLayer(galaxyProps);
  galaxyContext ??= getContext(galaxyCanvas, galaxyProps);
  render(galaxyContext, galaxyLayer);
  updateSolarSystem(0);
}

function updateSolarSystem(coord: number) {
  if (!galaxyLayer) return;
  const width = coord % 200;
  const height = (coord / 200) % 200;
  solarSystemProps.value = {
    width: galaxyLayer.props.width,
    height: galaxyLayer.props.height,
    seed: galaxyLayer.weights(width, height),
    weight: galaxyLayer.weights(width, height),
    galaxyProps: toRaw(galaxyLayer.props),
  };
}

watch(solarSystemProps, updateSolarSystemProps);
function updateSolarSystemProps(solarSystemProps?: SolarSystemProps) {
  if (!solarSystemProps) return;
  solarSystemLayer = makeSolarSystemLayer(solarSystemProps);
  solarSystemContext ??= getContext(solarSystemCanvas, solarSystemProps);
  render(solarSystemContext, solarSystemLayer);
  updatePlanet(0);
}

function updatePlanet(coord: number) {
  if (!solarSystemLayer) return;
  const width = coord % 200;
  const height = (coord / 200) % 200;
  planetProps.value = {
    width: solarSystemLayer.props.width,
    height: solarSystemLayer.props.height,
    seed: solarSystemLayer.weights(width, height),
    weight: solarSystemLayer.weights(width, height),
    solarSystemProps: toRaw(solarSystemLayer.props),
  };
}

watch(planetProps, updatePlanetProps);
function updatePlanetProps(planetProps?: PlanetProps) {
  if (!planetProps) return;
  planetLayer = makePlanetLayer(planetProps);
  planetContext ??= getContext(planetCanvas, planetProps);
  render(planetContext, planetLayer);
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

const coordFromEvent2 = (
  event: MouseEvent,
  dimensions: { width: number; height: number }
) => {
  return [
    Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  ] as [x: number, y: number];
};

const hoverUniverse = (event: MouseEvent) => {
  if (!universeLayer) return;
  universeHover.value = universeLayer.weights(
    ...coordFromEvent2(event, universeLayer.props)
  );
};

const clickUniverse = (event: MouseEvent) => {
  if (!universeLayer) return;
  updateGalaxy(coordFromEvent(event, universeLayer.props));
};

const hoverGalaxy = (event: MouseEvent) => {
  if (!galaxyLayer) return;
  galaxyHover.value = galaxyLayer.weights(
    ...coordFromEvent2(event, galaxyLayer.props)
  );
};

const clickGalaxy = (event: MouseEvent) => {
  if (!galaxyLayer) return;
  updateSolarSystem(coordFromEvent(event, galaxyLayer.props));
};

const hoverSolarSystem = (event: MouseEvent) => {
  if (!solarSystemLayer) return;
  solarSystemHover.value = solarSystemLayer.weights(
    ...coordFromEvent2(event, solarSystemLayer.props)
  );
};

const clickSolarSystem = (event: MouseEvent) => {
  if (!solarSystemLayer) return;
  updatePlanet(coordFromEvent(event, solarSystemLayer.props));
};

const hoverPlanet = (event: MouseEvent) => {
  if (!planetLayer) return;
  planetHover.value = planetLayer.heights(
    ...coordFromEvent2(event, planetLayer.props)
  );
};

function getContext(
  canvas: Ref<HTMLCanvasElement>,
  dimensions: { width: number; height: number }
) {
  if (!canvas.value) return null;
  canvas.value.width = dimensions.width;
  canvas.value.height = dimensions.height;
  return canvas.value.getContext("2d", {
    willReadFrequently: true,
  });
}

function render(context: CanvasRenderingContext2D | null, layer: Layer) {
  if (!context) return;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const xMax = layer.props.width;
  const yMax = layer.props.height;
  for (let x = 0; x < xMax; ++x) {
    for (let y = 0; y < yMax; ++y) {
      const v = layer.pixel(x, y);
      const i = (x + y * width) * 4;
      data[i] = (v[0] * 0xff) >>> 0;
      data[i + 1] = (v[1] * 0xff) >>> 0;
      data[i + 2] = (v[2] * 0xff) >>> 0;
      data[i + 3] = ((v[3] ?? 1) * 0xff) >>> 0;
    }
  }

  context.putImageData(imageData, 0, 0);
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
  background-color: #eee;
  margin-left: 5px;
  padding: 5px;
}
.canvas-wrap {
  position: relative;
  height: 200px;
  width: 200px;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>
./maps/planetMap
