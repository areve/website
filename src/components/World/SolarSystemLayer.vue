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
import { hsv2rgb } from "./lib/other";

export interface SolarSystemProps {
  weight: number;
  seed: number;
  dimensions: Dimensions;
}

export interface SolarSystemCoordSelected {
  coord: Coord;
  weight: number;
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
  return hueGenerator.getPoint(coord.x, coord.y);
}

function weights(coord: Coord) {
  const scale = props.weight / props.dimensions.height / props.dimensions.width;
  return generator.getPoint(coord.x, coord.y) * scale;
}

function floats(coord: Coord) {
  const generator = new PointGenerator(props.seed);
  return generator.getPoint(coord.x, coord.y) ** 100;
}

const pixel = (x: number, y: number) => {
  const v = floats({ x, y });
  const h = hues({ x, y });
  const [r, g, b] = hsv2rgb(h, 1, 1).map((v) => v / 4 + 0.75);
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
    weight,
  });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  generator = new PointGenerator(props.seed);
  hueGenerator = new PointGenerator(props.seed * 136395369829);
  render(canvas.value, props.dimensions, pixel);
};

onMounted(() => {
  update();
  selectionChanged({ x: 0, y: 0 });
});

watch(props, update);
</script>

<style scoped></style>
