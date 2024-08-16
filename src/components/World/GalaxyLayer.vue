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

export interface GalaxyProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
  galaxyAverageWeight: number;
}

export interface GalaxyCoordSelected {
  coord: Coord;
  size: number;
}

type GalaxyEmit = {
  (event: "coordSelected", value: GalaxyCoordSelected): void;
};

const title = "galaxy";
const description = "each dot is a solar system";

const props = defineProps<GalaxyProps>();
const emit = defineEmits<GalaxyEmit>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

let generator: PointGenerator;

const weights = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator.point(coord) * scale;
};

const pixel = (coord: Coord) => {
  const v = generator.point(coord);
  const weightRange = 1;
  const weightDiffToAverage = props.size / props.galaxyAverageWeight;
  const n = (v / weightRange) ** (20 / weightDiffToAverage);
  return [n, n, n];
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
  render(canvas.value, props.dimensions, pixel);
  selectionChanged({ x: 0, y: 0 });
};

onMounted(update);

watch(props, update);
</script>

<style scoped></style>

