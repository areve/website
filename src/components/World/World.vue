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
          @mousemove="layer.canvas.mousemove"
          @click="layer.canvas.click"
        ></canvas>
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
import { makePlanet, makePlanetProps } from "./maps/planetMap";
import { makeGalaxy, makeGalaxyProps } from "./maps/galaxyMap";
import { makeSolarSystem, makeSolarSystemProps } from "./maps/solarSystemMap";
import { Dimension, Coord } from "./maps/makeLayer";
import { clone } from "./lib/other";

const universe = makeUniverse({
  hover(coord: Coord) {
    // console.log(coord);
  },
  select(coord: Coord) {
    galaxy.props.value = makeGalaxyProps(universe, coord);
    solarSystem.props.value = makeSolarSystemProps(galaxy, coord);
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch([universe.canvas.element, universe.props], ([canvas, props]) =>
  render(canvas, props, universe.canvas.pixel)
);
const galaxy = makeGalaxy({
  hover(coord: Coord) {
    // console.log(coord);
  },
  select(coord: Coord) {
    solarSystem.props.value = makeSolarSystemProps(galaxy, coord);
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch([galaxy.canvas.element, galaxy.props], ([canvas, props]) =>
  render(canvas, props, galaxy.canvas.pixel)
);
const solarSystem = makeSolarSystem({
  hover(coord: Coord) {
    // console.log(coord);
  },
  select(coord: Coord) {
    planet.props.value = makePlanetProps(solarSystem, coord);
  },
});
watch([solarSystem.canvas.element, solarSystem.props], ([canvas, props]) =>
  render(canvas, props, solarSystem.canvas.pixel)
);
const planet = makePlanet({
  hover(coord: Coord) {
    // console.log(coord);
  },
  select(coord: Coord) {
    // console.log(coord);
  },
});
watch([planet.canvas.element, planet.props], ([canvas, props]) =>
  render(canvas, props, planet.canvas.pixel, props.camera)
);

const layers = {
  universe,
  galaxy,
  solarSystem,
  planet,
};

onMounted(async () => {
  galaxy.props.value = makeGalaxyProps(universe, { x: 0, y: 0 });
  solarSystem.props.value = makeSolarSystemProps(galaxy, { x: 0, y: 0 });
  planet.props.value = makePlanetProps(solarSystem, { x: 0, y: 0 });
  document.addEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  let x;
  let y;
  const props = clone(planet.props.value);
  if (event.key === "a") props.camera.x -= 50;
  if (event.key === "d") props.camera.x += 50;
  if (event.key === "w") props.camera.y -= 50;
  if (event.key === "s") props.camera.y += 50;
  planet.props.value = props;
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
  dimensions: Dimension,
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
