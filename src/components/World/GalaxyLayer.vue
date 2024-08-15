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
      <div>{{ hover.weight.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Dimensions, Coord, coordFromEvent } from "./maps/makeLayer";
import { render } from "./maps/render";
import { PointGenerator } from "./lib/prng";

export interface GalaxyProps {
  weight: number;
  seed: number;
  dimensions: Dimensions;
  galaxyAverageWeight: number;
}

export interface GalaxyCoordSelected {
  coord: Coord;
  weight: number;
}

type GalaxyEmit = {
  (
    event: "coordSelected",
    value: GalaxyCoordSelected
  ): void;
};

const title = "galaxy";
const description = "each dot is a solar system";

const props = defineProps<GalaxyProps>();
const emit = defineEmits<GalaxyEmit>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

const generator = new PointGenerator(props.seed);

const weights = (coord: Coord) => {
  const scale = props.weight / props.dimensions.height / props.dimensions.width;
  return generator.getPoint(coord.x, coord.y) * scale;
};

const pixel = (x: number, y: number) => {
  const v = generator.getPoint(x, y);
  const weightRange = 1;
  const weightDiffToAverage = props.weight / props.galaxyAverageWeight;
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

const click = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  const weight = weights(coord);
  emit("coordSelected", {
    coord,
    weight,
  });
};

const update = () => render(canvas.value, props.dimensions, pixel);
onMounted(() => {
  update();
  const coord = { x: 0, y: 0 };
  const weight = weights(coord);
  emit("coordSelected", {
    coord,
    weight,
  });
});
watch(props, update);
</script>

<style scoped></style>
