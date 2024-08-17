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
      <div>{{ hover.height.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render } from "./lib/render";
import { makePointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";
import { bicubic } from "./lib/bicubic";
import { hsv2rgb, Hsv, clamp } from "./lib/other";

export interface PlanetProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
  camera: Coord;
}

export interface PlanetCoordSelected {
  coord: Coord;
  size: number;
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

let generator: (coord: Coord) => number;

const heightFilterRadius = 10;
const heightFilter = diskFilter(heightFilterRadius);

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

const temperature = (coord: Coord) => bicubic(coord, 1 / 43, generator);
const moisture = (coord: Coord) =>
  bicubic(coord, 1 / 67, (coord: Coord) =>
    generator({ x: coord.x - 127.5, y: coord.y - 127.5 })
  );

function heights(coord: Coord) {
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < heightFilter.length; fy++) {
    for (let fx = 0; fx < heightFilter[0].length; fx++) {
      const px = x + 20 + fx;
      const py = y + 20 + fy;
      sum += heightFilter[fy][fx] * generator({ x: px, y: py });
    }
  }
  return ((sum - 0.5) * heightFilterRadius) / 1 + 0.5;
}

const clampZeroToOne = (v: number) => clamp(v, 0, 1);
const c = clampZeroToOne;
function pixel(coord: Coord) {
  const h = c(heights(coord));
  const t = c(temperature(coord));
  const m = c(moisture(coord));

  const isSea = h < 0.6;
  // const isCoastline = h > 0.6 && h < 0.63;
  // TODO get rid of isIcy and make i a curve that reflects it
  const isIcy = t < 0.25 || h > 0.9;
  const i = t * 3 + (h - 0.9) * 0.25;

  if (isSea) {
    // sea is greener in hotter areas
    // sea is greyer in moister areas
    // sea is darker when deeper
    const seaHsv: Hsv = [0.55 + t * 0.1, 1 - m * 0.3, h + 0.4];
    if (isIcy) {
      // return hsv2rgb([1, 0, 1]);
      // return hsv2rgb(seaHsv);
      return hsv2rgb([
        seaHsv[0],
        c(seaHsv[1] - 0.5 + 0.5 * i),
        c(seaHsv[2] + 0.5 - 0.5 * i),
      ]);
    } else {
      return hsv2rgb(seaHsv);
    }
  } else {
    // land is greener in moister areas
    // land is blacker in higher areas
    const landHsv: Hsv = [0.05 + m ** 0.6 * 0.2, 0.8 - h * 0.2, 1.4 - h];
    if (isIcy) {
      return hsv2rgb([
        landHsv[0],
        c(landHsv[1] - 0.5 + 0.5 * i),
        c(landHsv[2] + 0.5 - 0.5 * i),
      ]);
    } else {
      return hsv2rgb(landHsv);
    }
  }
}

const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    height: heights(coord),
    coord,
  };
};

const selectionChanged = (coord: Coord) => {
  const size = sizes(coord);
  emit("coordSelected", { coord, size });
};

const click = (event: MouseEvent) => {
  selectionChanged(coordFromEvent(event, props.dimensions));
};

const update = () => {
  console.log("planet update");
  generator = makePointGenerator(props.seed);
  render(canvas.value, props.dimensions, pixel, props.camera);
  selectionChanged({ x: 0, y: 0 });
};

onMounted(update);

watch(props, update);
</script>

<style scoped></style>
