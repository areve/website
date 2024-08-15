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

export interface UniverseProps {
  seed: number;
  weight: number;
  dimensions: Dimensions;
}

export interface UniverseCoordSelected {
  coord: Coord;
  weight: number;
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

let generator: PointGenerator;// = new (props.seed);

const weights = (coord: Coord) => {
  const scale = props.weight / props.dimensions.height / props.dimensions.width;
  return generator.getPoint(coord.x, coord.y) * scale;
};

const pixel = (x: number, y: number) => {
  const n = generator.getPoint(x, y);
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
    weight,
  });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  generator = new PointGenerator(props.seed);
  render(canvas.value, props.dimensions, pixel);
};

onMounted(() => {
  update();
  selectionChanged({ x: 0, y: 0 });
});

watch(props, update);
</script>

<style scoped></style>
