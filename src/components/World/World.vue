<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <section class="group" v-for="(layer, k) in layers">
      <div class="canvas-wrap">
        <canvas
          :ref="layer.canvas.element"
          class="canvas"
          @click="layer.canvas.click($event)"
          @mousemove="layer.canvas.hover($event)"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">{{ layer.meta.title }}</div>
        <div class="info">{{ layer.meta.description }}</div>
        <hr />
        <div>{{ layer.data.value.hover.toPrecision(3) }}</div>
        <!-- <div>{{ (layer.hoverData.value ?? 0).toPrecision(3) }}</div> -->
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { makeUniverse } from "./maps/universeMap";
import { makePlanet } from "./maps/planetMap";
import { makeGalaxy } from "./maps/galaxyMap";
import { makeSolarSystem } from "./maps/solarSystemMap";

const planet = makePlanet();
const solarSystem = makeSolarSystem(planet);
const galaxy = makeGalaxy(solarSystem);
const universe = makeUniverse(galaxy, solarSystem);

const layers = {
  universe,
  galaxy,
  solarSystem,
  planet,
};

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  // const earthWeightKg = 5.9e24;

  universe.update({
    height: 200,
    width: 200,
    seed: 1234567890,
    weight: thisUniverseWeightKg,
  });
  // galaxy.select(0, 0);
  // solarSystem.select(0, 0);
  // planet.select(0, 0);
  galaxy.update({
    height: universe.props.value.height,
    width: universe.props.value.width,
    seed: universe.engine.weights(0, 0),
    weight: universe.engine.weights(0, 0),
    galaxyAvgerageWeight:
      universe.props.value.weight /
      universe.props.value.width /
      universe.props.value.height,
  });
  solarSystem.update({
    height: galaxy.props.value.height,
    width: galaxy.props.value.width,
    seed: galaxy.engine.weights(0, 0),
    weight: galaxy.engine.weights(0, 0),
  });

  planet.update({
    height: solarSystem.props.value.height,
    width: solarSystem.props.value.width,
    seed: solarSystem.engine.weights(0, 0),
    weight: solarSystem.engine.weights(0, 0),
    camera: { x: 0, y: 0 },
  });

  document.addEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  let x;
  let y;
  // if (event.key === "a") x = (planetProps.value?.camera.x ?? 0) - 50;
  // if (event.key === "d") x = (planetProps.value?.camera.x ?? 0) + 50;
  // if (event.key === "w") y = (planetProps.value?.camera.y ?? 0) - 50;
  // if (event.key === "s") y = (planetProps.value?.camera.y ?? 0) + 50;
  // if (x !== undefined || y !== undefined) {
  //   if (!planetProps.value) return;
  //   planetProps.value = Object.assign({}, toRaw(planetProps.value), {
  //     camera: {
  //       x: x ?? planetProps.value?.camera.x ?? 0,
  //       y: y ?? planetProps.value?.camera.y ?? 0,
  //     },
  //   });
  // }
};
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
