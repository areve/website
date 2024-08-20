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
      <div>hover height: {{ hover.height.toPrecision(3) }}</div>
      <div>{{ hover.coord }}</div>
    </div>
    <div class="graphs">
      <GraphMini
        :dimensions="{
          width: 75 * getDevicePixelRatio(),
          height: 75 * getDevicePixelRatio(),
        }"
        :funcs="funcs"
        label=""
      ></GraphMini>
    </div>
    <hr />
    <div class="photo">
      <img
        src="./assets/New-global-view.width-1000.format-webp.webp"
        width="500"
        height="200"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render, getDevicePixelRatio } from "./lib/render";
import { makePointGenerator } from "./noise/prng";
import { bicubic } from "./curves/bicubic";
import { hsv2rgb, Hsv, clampZeroToOne } from "./lib/other";
import { makeSmoothCurveFunction } from "./curves/smoothCurve";
import { heightIcinessCurve, moistureDesertCurve, planetPixel, seaDepthCurve, temperatureDesertCurve, temperatureIcinessCurve } from "./layers/planetPixel";
import GraphMini from "./GraphMini.vue";

const funcs = [
  {
    label: "temperature iciness",
    color: [1, 0, 1],
    func: temperatureIcinessCurve,
  },
  {
    label: "height iciness",
    color: [1, 1, 0],
    func: heightIcinessCurve,
  },
  {
    label: "sea depth",
    color: [0, 1, 0],
    func: seaDepthCurve,
  },
  {
    label: "temperature desert",
    color: [1, 0, 0],
    func: temperatureDesertCurve,
  },
  {
    label: "moisture desert",
    color: [0, 1, 1],
    func: moistureDesertCurve,
  },
];

export interface PlanetProps {
  size: number;
  seed: number;
  dimensions: Dimensions;
  camera: Coord;
}

export interface PlanetCoordSelected {
  coord: Coord;
  size: number;
  height: number;
  moisture: number;
  temperature: number;
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

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

const temperature = (coord: Coord) => {
  const a = bicubic(coord, 1 / 65, generator);
  const b = bicubic(coord, 1 / 33, generator);
  const c = bicubic(coord, 1 / 9, generator);
  const d = generator(coord);

  return a * 0.5 + b * 0.3 + c * 0.23 + d * 0.07;
};

const moisture = (coord: Coord) => {
  const moistCoord = { x: coord.x - 127.5, y: coord.y - 127.5 };
  const a = bicubic(moistCoord, 1 / 65, generator);
  const b = bicubic(moistCoord, 1 / 28, generator);
  const c = bicubic(moistCoord, 1 / 11, generator);
  const d = generator(moistCoord);

  return a * 0.37 + b * 0.25 + c * 0.3 + d * 0.08;
};

function heights(coord: Coord) {
  const a = bicubic(coord, 1 / 29, (coord: Coord) =>
    generator({ x: coord.x - 21112.5, y: coord.y - 112127.5 })
  );

  const b = bicubic(coord, 1 / 17, (coord: Coord) =>
    generator({ x: coord.x - 2112.5, y: coord.y - 127.5 })
  );

  const c = bicubic(coord, 1 / 7, (coord: Coord) =>
    generator({ x: coord.x - 12.5, y: coord.y - 7.5 })
  );

  const d = generator({ x: coord.x - 1.5, y: coord.y - 1.5 });

  return a * 0.65 + b * 0.27 + c * 0.2 + d * 0.08;
}

const c = clampZeroToOne;
function pixel(coord: Coord) {
  const h = c(heights(coord));
  const t = c(temperature(coord));
  const m = c(moisture(coord));

  return planetPixel(coord, h, t, m);
}

const mousemove = (event: MouseEvent) => {
  const coord = coordFromEvent(event, props.dimensions);
  hover.value = {
    height: heights(coord),
    coord,
  };
};

const selectionChanged = (coord: Coord) => {
  emit("coordSelected", {
    coord,
    size: sizes(coord),
    temperature: temperature(coord),
    moisture: moisture(coord),
    height: heights(coord),
  });
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