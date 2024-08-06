<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>

    <div class="canvas-wrap">
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <pre>{{ details }}</pre>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref, watchEffect } from "vue";

const canvas = ref<HTMLCanvasElement>(undefined!);

class PRNG {
  private state: Uint8Array;

  constructor(seed: Uint8Array) {
    if (seed.length != 16) throw new Error("seed length must be 16");
    if (this.isAllZero(seed)) throw new Error("seed must not be all zeros");

    this.state = seed.slice(0, 16);
  }

  isAllZero(array: Uint8Array) {
    for (let i = 0; i < array.length; ++i) {
      if (array[i]) return false;
    }
    return true;
  }

  preventZeroState() {
    for (let i = 0; i < 16; ++i) {
      if (++this.state[i]) break;
    }
  }

  shuffle() {
    let carry = 0;
    for (let i = 15; i > 0; --i) {
      const result = this.state[i - 1] + this.state[i] + carry;
      this.state[i - 1] = result & 0xff; // keep only the lower 8 bits
      carry = result >> 8; // get the carry (upper 8 bits)
    }
  }

  getRandomStateArray(length: number) {
    const result: Uint8Array[] = new Array(length);
    for (let i = 0; i < result.length; i++) {
      result[i] = this.random_state().slice(0, 16); // TODO this will be slow :/
    }
    return result;
  }

  random_state(): Uint8Array {
    this.shuffle();
    return this.state;
  }

  random_int(): number {
    this.shuffle();
    this.preventZeroState();

    const value =
      (this.state[0] << 24) |
      (this.state[1] << 16) |
      (this.state[2] << 8) |
      this.state[3];
    return value >>> 0;
  }

  random_byte(): number {
    this.shuffle();

    this.preventZeroState();

    return this.state[0];
  }
}

interface Props {
  // seed: 0;
}
const seed = new Uint8Array(new Uint32Array([0, 0, 0, 1]).buffer);

const props = defineProps<Props>();

const width = 256;
const height = 256;
const channels = 4;

const details = ref("");

const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);

function getCells(seed: Uint8Array, totalWeight: number) {
  const generator = new PRNG(seed);
  const cellStates = generator.getRandomStateArray(width * height);
  const cellIntegers = cellStates.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );
  const sumCellIntegers = sum(cellIntegers);
  let cellWeights = cellIntegers.map(
    (v, i) => ((totalWeight * v) / sumCellIntegers) as number
  );
  return {
    cellWeights,
    cellIntegers,
    cellStates,
    stats: {
      totalWeight,
      sumCellIntegers,
    },
  };
}

onMounted(async () => {
  let data: string[] = [];

  const universeWeightKg = 1e53;
  const coord = 127 * 127 + 127;

  // universe
  const cells1 = getCells(seed, universeWeightKg);
  data.push("universeWeight:" + cells1.stats.totalWeight);
  data.push("cells1:" + cells1.cellWeights[coord]);

  // galaxy
  const cells2 = getCells(cells1.cellStates[coord], cells1.cellWeights[coord]);
  data.push("cells2:" + cells2.cellWeights[coord]);

  // solar system
  const cells3 = getCells(cells2.cellStates[coord], cells2.cellWeights[coord]);
  data.push("cells3:" + cells3.cellWeights[coord]);

  // star
  const cells4 = getCells(cells3.cellStates[coord], cells3.cellWeights[coord]);
  data.push("cells4:" + cells4.cellWeights[coord]);

  // planet
  const cells5 = getCells(cells4.cellStates[coord], cells4.cellWeights[coord]);
  data.push("cells5:" + cells5.cellWeights[coord]);

  // all oceans
  const cells6 = getCells(cells5.cellStates[coord], cells5.cellWeights[coord]);
  data.push("cells6:" + cells6.cellWeights[coord]);

  // continent
  const cells7 = getCells(cells6.cellStates[coord], cells6.cellWeights[coord]);
  data.push("cells7:" + cells7.cellWeights[coord]);

  details.value = data.join("\n");
  render(getContext(), cells7.cellIntegers);
});

function render(context: CanvasRenderingContext2D | null, data: number[]) {
  if (!context) return;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  // const imageData = context.getImageData(0, 0, width, height);
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * channels;

      pixelData[o + 0] = data[i] & 255;
      pixelData[o + 1] = (data[i] >> 8) & 255;
      pixelData[o + 2] = (data[i] >> 16) & 255;
      pixelData[o + 3] = (data[i] >> 24) & 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}

function getContext() {
  if (!canvas.value) return null;
  canvas.value.width = canvas.value.offsetWidth;
  canvas.value.height = canvas.value.offsetHeight;
  return canvas.value.getContext("2d", {
    willReadFrequently: true,
  });
}
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
  border: 1px solid #999;
}
</style>
