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
    <div class="graphs">
      <GraphMini
        :dimensions="{ width: 50, height: 50 }"
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
import { coordFromEvent, render } from "./lib/render";
import { makePointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";
import { bicubic } from "./curves/bicubic";
import { bilinear } from "./curves/bilinear";
import { hsv2rgb, Hsv, clamp } from "./lib/other";
import { Point } from "./curves/cubicBezier";
import GraphMini from "./GraphMini.vue";

function getValueCatmullRom(x: number, points: Point[]): number {
  function catmullRom1D(
    t: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number
  ): number {
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  }

  const n = points.length;

  let i = 0;
  while (i < n - 1 && x > points[i + 1].x) ++i;
  i = clamp(i, 0, n - 2);

  const p0 = points[i - 1] ?? {
    x: 2 * points[0].x - points[1].x,
    y: 2 * points[0].y - points[1].y,
  };
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[i + 2] ?? {
    x: 2 * points[n - 1].x - points[n - 2].x,
    y: 2 * points[n - 1].y - points[n - 2].y,
  };

  const t = (x - p1.x) / (p2.x - p1.x);

  return catmullRom1D(t, p0.y, p1.y, p2.y, p3.y);
}

const temperatureIcinessCurve = (x: number) => {
  const ret = getValueCatmullRom(x, [
    { x: 0, y: 1 },
    { x: 0.1, y: 0.99 },
    { x: 0.15, y: 0.9 },
    { x: 0.3, y: 0.4 },
    { x: 0.5, y: 0.1 },
    { x: 1, y: 0 },
  ]);
  return ret;
};

const heightIcinessCurve = (x: number) => {
  const ret = getValueCatmullRom(x, [
    { x: 0, y: 0 },
    { x: 0.1, y: 0.02 },
    { x: 0.85, y: 0.04 },
    { x: 0.95, y: 0.9 },
    { x: 1, y: 1 },
  ]);
  return ret;
};
const seaDepthCurve = (x: number) => {
  const ret = getValueCatmullRom(x, [
    { x: 0, y: 0 },
    { x: 0.05, y: 0.2 },
    { x: 0.25, y: 0.6 },
    { x: 0.5, y: 0.8},
    { x: 1, y: 1 },
  ]);
  return ret;
};
const funcs = [
  // {
  //   color: [0, 1, 0],
  //   func: (x: number) => x ** 2,
  // },
  // {
  //   color: [1, 0, 0],
  //   func: (x: number) => x,
  // },
  {
    color: [1, 0, 1],
    func: temperatureIcinessCurve,
  },
  {
    color: [1, 1, 0],
    func: heightIcinessCurve,
  },
  {
    color: [0, 1, 0],
    func: seaDepthCurve,
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

  return a * 0.25 + b * 0.25 + c * 0.3 + d * 0.2;
};

const heightFilterRadius = 20;
const heightFilter = diskFilter(heightFilterRadius);

function heights_faster(coord: Coord) {
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

  return a * 0.35 + b * 0.47 + c * 0.2 + d * 0.08;
}
function heights_old_slow(coord: Coord) {
  // TODO this applyFilter is really good but so slow
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

const heights = heights_faster;
const clampZeroToOne = (v: number) => clamp(v, 0, 1);
const c = clampZeroToOne;
function pixel(coord: Coord) {
  const h = c(heights(coord));
  const t = c(temperature(coord));
  const m = c(moisture(coord));

  const seaLevel = 0.6;
  const isSea = h < seaLevel;
  const sd = c(seaDepthCurve(1 - h / seaLevel));
  const sh = ((h - seaLevel) / (1 - seaLevel)) ** 0.5;
  const i = c(heightIcinessCurve(h) + temperatureIcinessCurve(t));

  if (isSea) {
    // shallow hsv(229, 47%, 64%)
    // normal water hsv(227, 70%, 35%)
    // deep hsv(231, 71%, 31%)
    const seaHsv: Hsv = [
      // we have unused m t here
      229 / 360,
      0.47 + sd * 0.242 - 0.1 + t * 0.2,
      0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1,
    ];
    return hsv2rgb([
      seaHsv[0], //
      c(seaHsv[1] - 0.2 * i),
      c(seaHsv[2] + 0.2 * i),
    ]);
  } else {
    // jungle hsv(92, 41%, 23%)
    // tundra hsv(78, 24%, 27%)
    // desert hsv(37, 35%, 89%)
    // australia hsv(31, 41%, 58%)
    // grass hsv(77, 34%, 40%)
    // mountain hsv(35, 21%, 64%)
    const landHsv: Hsv = [
      //
      77 / 360 - sh * (32 / 360) - 16 / 360 + m * (50 / 360),
      0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
      0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
    ]; //[0.05 + m ** 0.6 * 0.2, 0.8 - h * 0.2, 1.4 - h];
    return hsv2rgb([
      landHsv[0],
      c(landHsv[1] - 0.3 * i),
      c(landHsv[2] + 0.6 * i),
    ]);
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
