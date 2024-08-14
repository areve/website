<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <section class="group" v-for="(layer, k) in layers">
      <div class="canvas-wrap">
        <canvas :ref="layer.canvas.element" class="canvas"></canvas>
        <!-- @mousemove="layer.canvas.hover($event)" -->
        <!-- @click="layer.canvas.click($event)" -->
      </div>
      <div class="notes">
        <div class="title">{{ layer.meta.title }}</div>
        <div class="info">{{ layer.meta.description }}</div>
        <hr />
        <!-- <div>{{ layer.data.value.hover.toPrecision(3) }}</div> -->
        <!-- <div>{{ (layer.hoverData.value ?? 0).toPrecision(3) }}</div> -->
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, watch } from "vue";
import { makeUniverse } from "./maps/universeMap";
import { makePlanet } from "./maps/planetMap";
import { makeGalaxy } from "./maps/galaxyMap";
import { makeSolarSystem } from "./maps/solarSystemMap";
import { Dimensions } from "./maps/makeLayer";

//
// const solarSystem = makeSolarSystem(planet);
const universe = makeUniverse();
watch([universe.canvas.element, universe.props], ([canvas, props]) =>
  render(canvas, props, universe.canvas.pixel)
);
const galaxy = makeGalaxy();
watch([galaxy.canvas.element, galaxy.props], ([canvas, props]) =>
  render(canvas, props, galaxy.canvas.pixel)
);
const solarSystem = makeSolarSystem();
watch([solarSystem.canvas.element, solarSystem.props], ([canvas, props]) =>
  render(canvas, props, solarSystem.canvas.pixel)
);
const planet = makePlanet();
watch([planet.canvas.element, planet.props], ([canvas, props]) =>
  render(canvas, props, planet.canvas.pixel)
);

const layers = {
  universe,
  galaxy,
  solarSystem,
  planet,
};

onMounted(async () => {
  // // const actualUniverseWeightKg = 1e53;
  // const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // // const milkyWayWeightKg = 2.7e27;
  // // const earthWeightKg = 5.9e24;
  // universe.props.value = {
  //   height: 200,
  //   width: 200,
  //   seed: 1234567890,
  //   weight: thisUniverseWeightKg,
  // };
  // universe.update({
  //   height: 200,
  //   width: 200,
  //   seed: 1234567890,
  //   weight: thisUniverseWeightKg,
  // });
  // galaxy.select(0, 0);
  // solarSystem.select(0, 0);
  // planet.select(0, 0);
  galaxy.props.value = {
    height: universe.props.value.height,
    width: universe.props.value.width,
    seed: universe.data.weights(0, 0),
    weight: universe.data.weights(0, 0),
    galaxyAvgerageWeight:
      universe.props.value.weight /
      universe.props.value.width /
      universe.props.value.height,
  };

  // solarSystem.update({
  //   height: galaxy.props.value.height,
  //   width: galaxy.props.value.width,
  //   seed: galaxy.engine.weights(0, 0),
  //   weight: galaxy.engine.weights(0, 0),
  // });

  // planet.update({
  //   height: solarSystem.props.value.height,
  //   width: solarSystem.props.value.width,
  //   seed: solarSystem.engine.weights(0, 0),
  //   weight: solarSystem.engine.weights(0, 0),
  //   camera: { x: 0, y: 0 },
  // });

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
function getContext(
  canvas: HTMLCanvasElement | undefined,
  dimensions: {
    width: number;
    height: number;
  }
) {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d", {
    willReadFrequently: true,
  });
}

function render(
  canvas: HTMLCanvasElement,
  dimensions: Dimensions,
  pixel: (x: number, y: number) => number[],
  camera?: { x: number; y: number }
) {
  const context = getContext(canvas, dimensions);
  if (!context) return;
  const width = dimensions.width;
  const height = dimensions.height;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const xMax = dimensions.width;
  const yMax = dimensions.height;
  const cameraX = camera?.x ?? 0;
  const cameraY = camera?.y ?? 0;
  for (let x = 0; x < xMax; ++x) {
    for (let y = 0; y < yMax; ++y) {
      const v = pixel(x + cameraX, y + cameraY);
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
