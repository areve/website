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
    // console.log(seed)
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
      result[i] = this.random_state();
    }
    return result;
  }

  random_state(): Uint8Array {
    this.shuffle();
    return this.state.slice(0, 16); // TODO this will be slow :/
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
const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);
function getCells(seed: Uint8Array, totalWeight: number) {
  const generator = new PRNG(seed);
  const cellStates = generator.getRandomStateArray(width * height);
  const cellIntegers = cellStates.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );
  const sumCellIntegers = sum(cellIntegers);
  let cellWeights = cellIntegers.map(
    (v) => ((totalWeight * v) / sumCellIntegers) as number
  );
  let layerState = generator.random_state();
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

function makeHeightMap(weightMap: number[]) {
  const blurMore = [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ];
  const blur = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  const blurAmount = 25; // must be odd
  const reallyBlur = new Array(blurAmount)
    .fill(0)
    .map((v, x) =>
      new Array(blurAmount)
        .fill(0)
        .map(
          (v, y) =>
            ((blurAmount - 1) / 2) ** 2 -
            Math.abs((y - (blurAmount - 1) / 2) * (x - (blurAmount - 1) / 2))
        )
    );
  // console.log(reallyBlur)
  const filt = reallyBlur;
  const norm = sum(filt.map((v) => sum(v)));
  const size = (filt.length - 1) / 2;
  const result = weightMap.map((v, i, a) => {
    const x = i % width;
    const y = Math.floor(i / height);
    if (x < size || x >= width - size) return 0;
    if (y < size || y >= width - size) return 0;

    let output = 0;
    for (let fy = 0; fy < filt.length; ++fy) {
      for (let fx = 0; fx < filt[fy].length; ++fx) {
        const mult = filt[fy][fx];
        const coord = (y + fy - size) * width + (x + fx - size);
        const i2 = weightMap[coord] & 0xff;
        output += (i2 * mult) / norm;
      }
    }
    const value = output;
    return value; // + (value << 8) + (value << 16) + (value << 24);
  });

  // console.log(result)
  const minMax = result.reduce(
    (p, v, i) => {
      const x = i % width;
      const y = Math.floor(i / height);
      if (x < size || x >= width - size) return p;
      if (y < size || y >= width - size) return p;

      return {
        min: Math.min(p.min, Math.abs(v) & 0xff),
        max: Math.max(p.max, Math.abs(v) & 0xff),
      };
    },
    {
      min: 255,
      max: 0,
    }
  );

  // console.log(minMax);
  const result2 = result.map((v, i) => {
    const x = i % width;
    const y = Math.floor(i / height);
    if (x < size || x >= width - size) return v;
    if (y < size || y >= width - size) return v;

    const out = ((v - minMax.min) / (minMax.max - minMax.min)) * 255;
    // return out < 127 ? 0 : out;
    return out;
  });

  // console.log(result2);
  return result2;
}

onMounted(async () => {
  let data: string[] = [];

  const universeWeightKg = 1e53;
  const coord = 100 * 100 + 127;

  // universe
  const cells1 = getCells(seed, universeWeightKg);
  data.push("universeWeight:" + cells1.stats.totalWeight);
  data.push("cells1:" + cells1.cellWeights[coord]);

  // galaxy
  const cells2 = getCells(
    xor(cells1.stats.layerState, cells1.cellStates[coord]),
    cells1.cellWeights[coord]
  );
  data.push("cells2:" + cells2.cellWeights[coord]);

  // solar system
  const cells3 = getCells(
    xor(cells2.stats.layerState, cells2.cellStates[coord]),
    cells2.cellWeights[coord]
  );
  data.push("cells3:" + cells3.cellWeights[coord]);

  // star
  const cells4 = getCells(
    xor(cells3.stats.layerState, cells3.cellStates[coord]),
    cells3.cellWeights[coord]
  );
  data.push("cells4:" + cells4.cellWeights[coord]);

  // planet
  const cells5 = getCells(
    xor(cells4.stats.layerState, cells4.cellStates[coord]),
    cells4.cellWeights[coord]
  );
  data.push("cells5:" + cells5.cellWeights[coord]);

  const heightMap = makeHeightMap(cells5.cellIntegers);
  // console.log(heightMap);

  details.value = data.join("\n");
  render(getContext(), heightMap);
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

      if (data[i] < 150) {
        pixelData[o + 0] = 0;
        pixelData[o + 1] = 0; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = data[i] & 0xff; //(data[i] >> 16) & 0xff;
      } else {
        pixelData[o + 0] = 180;
        pixelData[o + 1] = data[i] & 0xff; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = 0; //(data[i] >> 16) & 0xff;
      }
      pixelData[o + 3] = 255; //(data[i] >> 24) & 0xff;
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
