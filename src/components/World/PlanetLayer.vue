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
import { makePointGenerator, PointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";
import { clone } from "./lib/other";

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

let generator: any;

const filterRadius = 10;
const filter = diskFilter(filterRadius);

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

function heights(coord: Coord) {
  const padHeight = Math.floor(filter.length / 2);
  const padWidth = Math.floor(filter[0].length / 2);
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < filter.length; fy++) {
    for (let fx = 0; fx < filter[0].length; fx++) {
      const px = x + 20 + fx - padWidth;
      const py = y + 20 + fy - padHeight;
      sum += filter[fy][fx] * generator({ x: px, y: py });
    }
  }
  return ((sum - 0.5) * filterRadius) / 2 + 0.5;
}

function pixel(coord: Coord) {
  const n = heights(coord);
  return n > 0.5 //
    ? [n - 0.5, n - 0.25, 0]
    : [0, n, n + 0.5];
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
