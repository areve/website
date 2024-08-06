<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>click the top map to see the detail</p>

    <div class="canvas-wrap">
      <canvas
        ref="universeCanvas"
        class="canvas"
        @click="clickUniverse"
        @mousemove="hoverUniverse"
      ></canvas>
    </div>
    <div>{{ Math.floor(hover) }}</div>
    <div>{{ Math.floor(clickData) }}</div>
    <div class="canvas-wrap">
      <canvas ref="planetCanvas" class="canvas"></canvas>
    </div>
    <pre>{{ details }}</pre>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from "vue";
import { diskFilter } from "./filters/diskFilter";
import { PRNG } from "./lib/prng";

const universeCanvas = ref<HTMLCanvasElement>(undefined!);
const planetCanvas = ref<HTMLCanvasElement>(undefined!);

const hover = ref(0.45);
const clickData = ref(0.45);
const details = ref("");

const seed = new TextEncoder().encode("This is the seed");

const width = 256;
const height = 256;

const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);
const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);

function getCells(seed: Uint8Array, totalWeight: number) {
  const generator = new PRNG(seed);
  const cellStates = generator.getStateArray(width * height);
  const cellIntegers = cellStates.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );
  const sumCellIntegers = sum(cellIntegers);
  let cellWeights = cellIntegers.map(
    (v) => ((totalWeight * v) / sumCellIntegers) as number
  );
  let layerState = generator.getState();
  return {
    cellWeights,
    cellIntegers,
    cellStates,
    stats: {
      totalWeight,
      sumCellIntegers,
      layerState,
    },
  };
}

function makeUniverseMap(weightMap: number[]) {
  return weightMap;
}

function makePlanetMap(weightMap: number[], weight: number) {
  const filter = diskFilter(10);
  const size = (filter.length - 1) / 2;
  const result = weightMap.map((v, i, a) => {
    const x = i % width;
    const y = Math.floor(i / height);
    if (x < size || x >= width - size) return 0;
    if (y < size || y >= width - size) return 0;

    let output = 0;
    for (let fy = 0; fy < filter.length; ++fy) {
      for (let fx = 0; fx < filter[fy].length; ++fx) {
        const mult = filter[fy][fx];
        const coord = (y + fy - size) * width + (x + fx - size);
        const i2 = weightMap[coord];
        output += i2 * mult;
      }
    }
    const value = (output - 0xffffffff / 2) * 8 + 0xffffffff / 2; //* totalWeight / universeWeightKg;
    const out2 = value * (weight / 0xffffffff) * 2; //value + weight //* 255 * 255 * 255; // + (value << 8) + (value << 16) + (value << 24);
    return Math.max(Math.min(out2, 0xffffffff), 0);
  });

  return result;
}

interface Cells {
  cellWeights: number[];
  cellIntegers: number[];
  cellStates: Uint8Array[];
  stats: {
    totalWeight: number;
    sumCellIntegers: number;
    layerState: Uint8Array;
  };
}
let universe: Cells;
const universeWeightKg = 1e53;
onMounted(async () => {
  let data: string[] = [];

  const coord = 100 * 100 + 127;

  // universe
  // galaxy
  // solar system
  // star
  // planet
  // continent
  // country
  // city
  // house

  universe = getCells(seed, universeWeightKg);
  data.push("universeWeight:" + universe.stats.totalWeight);
  data.push("cells1:" + universe.cellWeights[coord]);

  const universeMap = makeUniverseMap(universe.cellIntegers);

  details.value = data.join("\n");
  renderUniverse(getContext(universeCanvas), universeMap);
});

function renderUniverse(
  context: CanvasRenderingContext2D | null,
  data: number[]
) {
  if (!context) return;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;
      pixelData[o + 0] = ((data[i] / 0xffffffff) * 255) & 0xff;
      pixelData[o + 1] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 8) & 0xff;
      pixelData[o + 2] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 16) & 0xff;

      pixelData[o + 3] = 255; 
    }
  }

  context.putImageData(imageData, 0, 0);
}

function renderPlanet(
  context: CanvasRenderingContext2D | null,
  data: number[]
) {
  if (!context) return;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      const vv = ((data[i] / 0xffffffff) * 255) & 0xff;
      if (vv > 127) {
        pixelData[o + 0] = vv;
        pixelData[o + 1] = vv * 2 - 127; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = 0; //(data[i] >> 16) & 0xff;
      } else {
        pixelData[o + 0] = 0;
        pixelData[o + 1] = vv; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = vv * 2; //(data[i] >> 16) & 0xff;
      }

      pixelData[o + 3] = 255; //(data[i] >> 24) & 0xff;
    }
  }

  context.putImageData(imageData, 0, 0);
}

function getContext(canvas: Ref<HTMLCanvasElement>) {
  if (!canvas.value) return null;
  canvas.value.width = canvas.value.offsetWidth;
  canvas.value.height = canvas.value.offsetHeight;
  return canvas.value.getContext("2d", {
    willReadFrequently: true,
  });
}

const hoverUniverse = (event: MouseEvent) => {
  // console.log(hoverUniverse)
  const clickPoint = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = clickPoint.y * width + clickPoint.x;
  // console.log(clickPoint, universe.cellIntegers[coord] & 0xff);
  hover.value = (universe.cellIntegers[coord] / 0xffffffff) * 255;
};

const clickUniverse = (event: MouseEvent) => {
  const clickPoint = {
    x: event.offsetX,
    y: event.offsetY,
  };
  const coord = clickPoint.y * width + clickPoint.x;
  clickData.value = (universe.cellIntegers[coord] / 0xffffffff) * 255;
  // console.log(clickPoint, universe.cellIntegers[coord] & 0xff);

  // planet
  const planet = getCells(
    xor(universe.stats.layerState, universe.cellStates[coord]),
    universe.cellWeights[coord]
  );

  const planetMap = makePlanetMap(
    planet.cellIntegers,
    universe.cellIntegers[coord]
  );
  renderPlanet(getContext(planetCanvas), planetMap);
};
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  height: 256px;
  width: 256px;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>
