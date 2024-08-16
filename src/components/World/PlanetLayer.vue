<template>
  <div class="canvas-wrap">
    <canvas
      ref="canvas"
      class="canvas"
      @mousemove="mousemove"
      @click="click"
    ></canvas>
  </div>
  <div class="notes">
    <div class="title">{{ title }}</div>
    <div class="info">{{ description }}</div>
    <hr />
    <div class="data">
      <div>{{ size.toPrecision(3) }}</div>
      <div>{{ hover.height.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render } from "./lib/render";
import { makePointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";
import { bicubic } from "./lib/bicubic";
import { bilinear } from "./lib/bilinear";

export interface PlanetProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
  camera: Coord;
}

export interface PlanetCoordSelected {
  coord: Coord;
  size: number;
}

type PlanetEmit = {
  (event: "coordSelected", value: PlanetCoordSelected): void;
};

const title = "planet";
const description =
  "each dot is a point on a point on the planet sized region of the solar system";

const props = defineProps<PlanetProps>();
const emit = defineEmits<PlanetEmit>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ height: 0, coord: { x: 0, y: 0 } });

let generator: (coord: Coord) => number;

const heightFilterRadius = 10;
const heightFilter = diskFilter(heightFilterRadius);

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

const temperature = (coord: Coord) => bicubic(coord, 1 / 43, generator);
const moisture = (coord: Coord) =>
  bicubic(coord, 1 / 67, (coord: Coord) =>
    generator({ x: coord.x - 127.5, y: coord.y - 127.5 })
  );

function heights(coord: Coord) {
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < heightFilter.length; fy++) {
    for (let fx = 0; fx < heightFilter[0].length; fx++) {
      const px = x + 20 + fx;
      const py = y + 20 + fy;
      sum += heightFilter[fy][fx] * generator({ x: px, y: py });
    }
  }
  return ((sum - 0.5) * heightFilterRadius) / 2 + 0.5;
}

function pixel(coord: Coord) {
  const h = heights(coord);
  const t = temperature(coord);
  const m = moisture(coord);
  // return [m, t, h];
  if (h > 0.5) {
    if (t < 0.33) {
      // frozen land
      return [h - 0.5 + 0.3, h - 0.25+ 0.3, 0+ 0.3];
    } else {
      // land
      if (m > 0.5) {
        // hydrated land
        return [h - 0.5, h - 0.25, 0];
      }else{
        // dry land
        return [h - 0.1, h - 0.25, 0];

      }
    }
  } else {
    if (t < 0.33) {
      // frozen sea
      // return [0, 0, 0];
      return [(1 - t) * h + 0.5, (1 - t) * h + 0.5, (1 - t) * h + 0.5];
    } else {
      // sea
      return [0, h, h + 0.5];
    }
  }
}

const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    height: heights(coord),
    coord,
  };
};

const selectionChanged = (coord: Coord) => {
  const size = sizes(coord);
  emit("coordSelected", { coord, size });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  console.log("planet update");
  generator = makePointGenerator(props.seed);
  render(canvas.value, props.dimensions, pixel, props.camera);
  selectionChanged({ x: 0, y: 0 });
};

onMounted(update);

watch(props, update);
</script>

<style scoped></style>
