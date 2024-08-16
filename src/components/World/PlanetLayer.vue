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
import { computed, onMounted, ref, watch } from "vue";
import { Coord, Dimensions } from "./lib/interfaces";
import { coordFromEvent, render } from "./lib/render";
import { makePointGenerator, PointGenerator } from "./lib/prng";
import { diskFilter } from "./filters/diskFilter";
import { clone } from "./lib/other";

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
const tempFilterRadius = 20;
const tempFilter = diskFilter(tempFilterRadius);

const sizes = (coord: Coord) => {
  const scale = props.size / props.dimensions.height / props.dimensions.width;
  return generator(coord) * scale;
};

function bilinearInterpolation(
  inputArray: number[][],
  newHeight: number,
  newWidth: number
): number[][] {
  const oldHeight = inputArray.length;
  const oldWidth = inputArray[0].length;

  // Calculate the scaling factors
  const heightScale = (oldHeight - 1) / (newHeight - 1);
  const widthScale = (oldWidth - 1) / (newWidth - 1);

  // Create the output array
  const outputArray: number[][] = Array.from({ length: newHeight }, () =>
    Array(newWidth).fill(0)
  );

  for (let i = 0; i < newHeight; i++) {
    for (let j = 0; j < newWidth; j++) {
      // Find the position in the input array
      const x = i * heightScale;
      const y = j * widthScale;

      // Calculate the coordinates of the surrounding pixels
      const x0 = Math.floor(x);
      const x1 = Math.min(x0 + 1, oldHeight - 1);
      const y0 = Math.floor(y);
      const y1 = Math.min(y0 + 1, oldWidth - 1);

      // Calculate the differences
      const dx = x - x0;
      const dy = y - y0;

      // Perform bilinear interpolation
      outputArray[i][j] =
        inputArray[x0][y0] * (1 - dx) * (1 - dy) +
        inputArray[x0][y1] * (1 - dx) * dy +
        inputArray[x1][y0] * dx * (1 - dy) +
        inputArray[x1][y1] * dx * dy;
    }
  }

  return outputArray;
}
const originalArray = [
  [1, 1, 0],
  [0, 0, 0],
  [0, 1, 0],
];

const resizedArray = bilinearInterpolation(originalArray, 4, 4);
console.log(resizedArray);

function temperature_orig(coord: Coord) {
  // this is all quite slow
  const { x, y } = coord;
  let sum = 0;
  for (let fy = 0; fy < tempFilter.length; fy++) {
    for (let fx = 0; fx < tempFilter[0].length; fx++) {
      const px = ((x + 20 + fx) / 30) >>> 0;
      const py = ((y + 20 + fy) / 30) >>> 0;
      sum += tempFilter[fy][fx] * generator({ x: px * 999999, y: py * 999999 });
    }
  }
  return sum;
}

function temperature_bilinear(coord: Coord) {
  const heightScale = 1 / 40;
  const widthScale = 1 / 40;

  const oldWidth = props.dimensions.width; // TODO props access will be slow
  const oldHeight = props.dimensions.height;

  // Find the position in the input array
  const x = coord.x * widthScale;
  const y = coord.y * heightScale;

  // Calculate the coordinates of the surrounding pixels
  const x0 = Math.floor(x);
  const x1 = Math.min(x0 + 1, oldHeight - 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(y0 + 1, oldWidth - 1);

  // Calculate the differences
  const dx = x - x0;
  const dy = y - y0;

  // Perform bilinear interpolation
  return (
    generator({ x: x0, y: y0 }) * (1 - dx) * (1 - dy) +
    generator({ x: x0, y: y1 }) * (1 - dx) * dy +
    generator({ x: x1, y: y0 }) * dx * (1 - dy) +
    generator({ x: x1, y: y1 }) * dx * dy
  );
}

function cubicInterpolate(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  return (
    p1 +
    0.5 *
      t *
      (p2 -
        p0 +
        t *
          (2.0 * p0 -
            5.0 * p1 +
            4.0 * p2 -
            p3 +
            t * (3.0 * (p1 - p2) + p3 - p0)))
  );
}

function temperature_bicubic(coord: Coord): number {
  const heightScale = 1 / 40;
  const widthScale = 1 / 40;

  const oldWidth = props.dimensions.width; // TODO looking up props on each pixel will be slow
  const oldHeight = props.dimensions.height;

  // Find the position in the input array
  const x = coord.x * widthScale;
  const y = coord.y * heightScale;

  // Calculate the top-left corner of the 4x4 grid of surrounding pixels
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;

  // Calculate the differences (fractions within the grid cell)
  const dx = x - (x0 + 1);
  const dy = y - (y0 + 1);

  // Fetch the 4x4 grid of surrounding points
  const grid: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const row: number[] = [];
    for (let j = 0; j < 4; j++) {
      // Clamp the coordinates to ensure they stay within valid bounds
      const xj = Math.min(Math.max(x0 + j, 0), oldWidth - 1);
      const yi = Math.min(Math.max(y0 + i, 0), oldHeight - 1);
      row.push(generator({ x: xj, y: yi }));
    }
    grid.push(row);
  }
  // console.log(grid)

  // Perform bicubic interpolation on the grid
  const colValues = [];
  for (let i = 0; i < 4; i++) {
    colValues.push(
      cubicInterpolate(grid[i][0], grid[i][1], grid[i][2], grid[i][3], dx)
    );
  }

  return cubicInterpolate(
    colValues[0],
    colValues[1],
    colValues[2],
    colValues[3],
    dy
  );
}

const temperature = temperature_bicubic;

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
  return ((sum - 0.5) * heightFilterRadius) / 2 + 0.5;
}

function pixel(coord: Coord) {
  const n = heights(coord);
  const t = temperature(coord);
  // return [t, t, t];
  return n > 0.5 //
    ? [n - 0.5, n - 0.25, t]
    : [t, n, n + 0.5];
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
