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

export interface UniverseProps {
  seed: number;
  size: number;
  dimensions: Dimensions;
}

export interface UniverseCoordSelected {
  coord: Coord;
  size: number;
}

type UniverseType = {
  (event: "coordSelected", value: UniverseCoordSelected): void;
};

const title = "universe";
const description = "each dot is a galaxy";

const props = defineProps<UniverseProps>();
const emit = defineEmits<UniverseType>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

let generator: PointGenerator; // = new (props.seed);

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator.point(coord) * scale;
};

const pixel = (coord: Coord) => {
  const n = generator.point(coord);
  return [n, n, n];
};

const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    weight: sizes(coord),
    coord,
  };
};

const selectionChanged = (coord: Coord) => {
  const weight = sizes(coord);
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
./lib/render./lib/render
