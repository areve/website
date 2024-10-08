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
      <div>size: {{ size.toPrecision(3) }}</div>
      <div>height: {{ height.toPrecision(3) }}</div>
      <div>temperature: {{ temperature.toPrecision(3) }}</div>
      <div>moisture: {{ moisture.toPrecision(3) }}</div>
      <div>{{ hover.height.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render } from "./lib/render";
import { PointGenerator } from "./noise/prng";
import { diskFilter } from "./filters/diskFilter";
import {
  heightIcinessCurve,
  moistureDesertCurve,
  planetPixel,
  seaDepthCurve,
  temperatureDesertCurve,
  temperatureIcinessCurve,
} from "./layers/planetPixel";

export interface CountryProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
  camera: Coord;
  height: number;
  temperature: number;
  moisture: number;
}

export interface CountryCoordSelected {
  coord: Coord;
  size: number;
}

type CountryEmit = {
  (event: "coordSelected", value: CountryCoordSelected): void;
};

const title = "country";
const description = "each dot is a city size region";

const props = defineProps<CountryProps>();
const emit = defineEmits<CountryEmit>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ height: 0, coord: { x: 0, y: 0 } });

let generator: PointGenerator;

const filterRadius = 10;
const filter = diskFilter(filterRadius);

function heights(coord: Coord) {
  const padHeight = Math.floor(filter.length / 2);
  const padWidth = Math.floor(filter[0].length / 2);
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < filter.length; fy++) {
    for (let fx = 0; fx < filter[0].length; fx++) {
      const px = x + 20 + fx - padWidth;
      const py = y + 20 + fy - padHeight;
      sum += filter[fy][fx] * generator.point({ x: px, y: py });
    }
  }
  return ((sum - 0.5) * filterRadius) / 2 + 0.5;
}

function pixel(coord: Coord) {
  const n = heights(coord);

  const base = planetPixel(
    coord,
    props.height,
    props.temperature,
    props.moisture
  );

  return [
    base[0] + n * 0.5 - 0.25,
    base[1] + n * 0.5 - 0.25,
    base[2] + n * 0.5 - 0.25,
  ];
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
    size: height,
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

<style scoped>
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
</style>