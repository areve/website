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
      <div>{{ weight.toPrecision(3) }}</div>
      <div>{{ hover.height.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Dimensions, Coord, coordFromEvent } from "./maps/makeLayer";
import { render } from "./maps/render";
import { PointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";

export interface PlanetProps {
  weight: number;
  seed: number;
  dimensions: Dimensions;
  camera: Coord;
}

export interface PlanetCoordSelected {
  coord: Coord;
  height: number;
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

let generator: PointGenerator;

const filterRadius = 10;
const filter = diskFilter(filterRadius);

function heights(coord: Coord) {
  const generator = new PointGenerator(props.seed);
  const padHeight = Math.floor(filter.length / 2);
  const padWidth = Math.floor(filter[0].length / 2);
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < filter.length; fy++) {
    for (let fx = 0; fx < filter[0].length; fx++) {
      const px = x + 20 + fx - padWidth;
      const py = y + 20 + fy - padHeight;
      sum += filter[fy][fx] * generator.getPoint(px, py);
    }
  }
  return ((sum - 0.5) * filterRadius) / 2 + 0.5;
}

function pixel(x: number, y: number) {
  const n = heights({ x, y });
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
  const height = heights(coord);
  emit("coordSelected", {
    coord,
    height,
  });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  generator = new PointGenerator(props.seed);
  render(canvas.value, props.dimensions, pixel, props.camera);
  selectionChanged({ x: 0, y: 0 });
};

onMounted(update);

watch(props, update);
</script>

<style scoped></style>
