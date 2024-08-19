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
      <div>{{ hover.weight.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render } from "./lib/render";
import { PointGenerator } from "./lib/prng";
import { hsv2rgb } from "./lib/other";

export interface SolarSystemProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
}

export interface SolarSystemCoordSelected {
  coord: Coord;
  size: number;
}

type SolarSystemEmit = {
  (event: "coordSelected", value: SolarSystemCoordSelected): void;
};

const title = "solar system";
const description = "each dot is a sun, planet, moon, asteroid";

const props = defineProps<SolarSystemProps>();
const emit = defineEmits<SolarSystemEmit>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

let generator: PointGenerator;
let hueGenerator: PointGenerator;

function hues(coord: Coord) {
  return hueGenerator.point(coord);
}

function weights(coord: Coord) {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator.point(coord) * scale;
}

function floats(coord: Coord) {
  return generator.point(coord) ** 100;
}

const pixel = (coord: Coord) => {
  const v = floats(coord);
  const h = hues(coord);
  const [r, g, b] = hsv2rgb([h, 1, 1]).map((v) => v / 4 + 0.75);
  return [v * r, v * g, v * b];
};

const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    weight: weights(coord),
    coord,
  };
};

const selectionChanged = (coord: Coord) => {
  const weight = weights(coord);
  emit("coordSelected", {
    coord,
    size: weight,
  });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  generator = new PointGenerator(props.seed);
  hueGenerator = new PointGenerator(props.seed * 136395369829);
  render(canvas.value, props.dimensions, pixel);
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
