<template>
  <section class="world">
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <section class="group">
      <UniverseLayer
        :seed="1234567890"
        :dimensions="{ width: 200, height: 200 }"
        @clickAt="universeClickAt"
      ></UniverseLayer>
    </section>
    <section class="group" v-for="(layer, k) in layers">
      <div class="canvas-wrap">
        <canvas
          :ref="layer.canvas.element"
          class="canvas"
          @mousemove="layer.canvas.mousemove"
          @click="layer.canvas.click"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">{{ layer.data.value.title }}</div>
        <div class="info">{{ layer.data.value.description }}</div>
        <hr />
        <div v-if="layer.type === 'planet'">
          <div class="data">
            <div>{{ layer.data.value.weight.toPrecision(3) }}</div>
            <div>{{ layer.data.value.hover.height.toPrecision(3) }}</div>
            <div>{{ layer.data.value.hover.coord }}</div>
          </div>
        </div>
        <div v-else>
          <div class="data">
            <div>{{ layer.data.value.weight.toPrecision(3) }}</div>
            <div>{{ layer.data.value.hover.weight.toPrecision(3) }}</div>
            <div>{{ layer.data.value.hover.coord }}</div>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, watch } from "vue";
import { makeUniverse, makeUniverseProps } from "./maps/universeMap";
import { makePlanet, makePlanetProps } from "./maps/planetMap";
import { makeGalaxy, makeGalaxyProps } from "./maps/galaxyMap";
import { makeSolarSystem, makeSolarSystemProps } from "./maps/solarSystemMap";
import { Dimensions, Coord } from "./maps/makeLayer";
import { clone } from "./lib/other";
import { render } from "./maps/render";
import UniverseLayer from "./UniverseLayer.vue";

const universeClickAt = (coord: Coord) => {
  console.log("Coord", coord);
};
const universe = makeUniverse({
  select(coord: Coord) {
    galaxy.props.value = makeGalaxyProps(universe, coord);
    solarSystem.props.value = makeSolarSystemProps(galaxy, coord);
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch(universe.props, (props) =>
  render(universe.canvas.element.value, props, universe.methods.pixel)
);
const galaxy = makeGalaxy({
  select(coord: Coord) {
    solarSystem.props.value = makeSolarSystemProps(galaxy, coord);
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch(galaxy.props, (props) =>
  render(galaxy.canvas.element.value, props, galaxy.methods.pixel)
);
const solarSystem = makeSolarSystem({
  select(coord: Coord) {
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch(solarSystem.props, (props) =>
  render(solarSystem.canvas.element.value, props, solarSystem.methods.pixel)
);
const planet = makePlanet({
  select(coord: Coord) {},
});
watch(planet.props, (props) =>
  render(planet.canvas.element.value, props, planet.methods.pixel, props.camera)
);

const layers = {
  universe,
  galaxy,
  solarSystem,
  planet,
};

onMounted(async () => {
  universe.props.value = makeUniverseProps();
  galaxy.props.value = makeGalaxyProps(universe, { x: 0, y: 0 });
  solarSystem.props.value = makeSolarSystemProps(galaxy, { x: 0, y: 0 });
  planet.props.value = makePlanetProps(solarSystem, { x: 0, y: 0 });
  document.addEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  const props = clone(planet.props.value);
  if (event.key === "a") props.camera.x -= 50;
  if (event.key === "d") props.camera.x += 50;
  if (event.key === "w") props.camera.y -= 50;
  if (event.key === "s") props.camera.y += 50;
  planet.props.value = props;
};
</script>

<style>
.world {
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
  .data {
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
}
</style>
