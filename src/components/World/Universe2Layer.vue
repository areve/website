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
import { makeSmoothstepAndLinearGenerator } from "./noise/smoothStep";

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

const title = "universe2";
const description = "not connected to the others, experimental";

const props = defineProps<UniverseProps>();
const emit = defineEmits<UniverseType>();

const canvas = ref<HTMLCanvasElement>(undefined!);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

let generator: (coord: Coord) => number;

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

const pixel = (coord: Coord) => {
  const n = generator(coord);
  // console.log(n)
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
  generator = makeSmoothstepAndLinearGenerator(props.seed);
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
