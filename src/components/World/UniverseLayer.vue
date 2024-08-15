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
import { onMounted, ref } from "vue";
import { Dimensions, Coord, coordFromEvent } from "./maps/makeLayer";
import { render } from "./maps/render";
import { PointGenerator } from "./lib/prng";

export interface UniverseProps {
  seed: number;
  dimensions: Dimensions;
}

const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
// const actualUniverseWeightKg = 1e53;
const title = "universe";
const description = "each dot is a galaxy";

const props = defineProps<UniverseProps>();
const emit = defineEmits(["clickAt"]);

const canvas = ref<HTMLCanvasElement>(undefined!);
const weight = ref(thisUniverseWeightKg);
const hover = ref({ weight: 0, coord: { x: 0, y: 0 } });

const generator = new PointGenerator(props.seed);

const weights = (coord: Coord) => {
  const scale = weight.value / props.dimensions.height / props.dimensions.width;
  return generator.getPoint(coord.x, coord.y) * scale;
};

const pixel = (x: number, y: number) => {
  const n = generator.getPoint(x, y);
  return [n, n, n];
};

// const milkyWayWeightKg = 2.7e27;
// const earthWeightKg = 5.9e24;
const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    weight: weights(coord),
    coord,
  };
};

const click = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  emit("clickAt", coord);
};

onMounted(() => render(canvas.value, props.dimensions, pixel));
</script>

<style scoped>
</style>
