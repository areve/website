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

interface Props {
  // seed: 0;
}
const seed = new Uint8Array(new Uint32Array([0, 0, 0, 1]).buffer)

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
  // console.log(cellStates)

  const sumCellIntegers = cellIntegers.reduce((p, c) => p + c, 0);

  let cellWeights = cellIntegers.map((v, i) => (totalWeight * v / sumCellIntegers) as number);
  return {
    cellWeights,
    cellStates
  }
}

onMounted(async () => {
  let data: string[] = [];

  const universeWeightKg = 1e53;
  const sunWeightKg = 1.989e30;
  const coord = 127 * 127 + 127;
  // console.log(universeWeightKg)

  // universe
  const cells = getCells(seed, universeWeightKg);
  data.push("universeWeight:" + sum(cells.cellWeights));
  
  // galaxy
  const cells2 = getCells(cells.cellStates[coord], cells.cellWeights[coord]);
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
  
  // country
  const cells8 = getCells(cells7.cellStates[coord], cells7.cellWeights[coord]);
  data.push("cells8:" + cells8.cellWeights[coord]);
  
  // city
  const cells9 = getCells(cells8.cellStates[coord], cells8.cellWeights[coord]);
  data.push("cells9:" + cells9.cellWeights[coord]);
  
  // house
  const cells10 = getCells(cells9.cellStates[coord], cells9.cellWeights[coord]);
  data.push("cells10:" + cells10.cellWeights[coord]);
  
  // human
  const cells11 = getCells(cells10.cellStates[coord], cells10.cellWeights[coord]);
  data.push("cells11:" + cells11.cellWeights[coord]);
  
  // insect
  const cells12 = getCells(cells11.cellStates[coord], cells11.cellWeights[coord]);
  data.push("cells12:" + cells12.cellWeights[coord]);

  // data.push("cells2.1:" + cells2.cellStates[1]);

  // const generator2 = new PRNG(seed);
  // const cellStates2 = generator2.getRandomStateArray(width * height);

  // data.push(metaData.toString());

  // let meta = 3;
  // const metaData = generator.getRandomArray(meta);
  // let [foo, bar, baz] = metaData;
  // data.push("foo:" + foo);
  // data.push("bar:" + bar);
  // data.push("baz:" + baz);
  details.value = data.join("\n");
  render(getContext());
});

class PRNG {
  private rng_state: Uint8Array;

  constructor(seed: Uint8Array) {
    if (seed.length != 16) throw new Error("seed length must be 16");
    
    this.rng_state = seed//new Uint8Array(16);
    console.log('foo', this.rng_state)

    // let b = new Uint32Array([10, 11, 12, 13]);
    // console.log(new Uint8Array(b.buffer));
    // this.rng_state[0] = (seed >> 24) & 0xff;
    // this.rng_state[1] = (seed >> 16) & 0xff;
    // this.rng_state[2] = (seed >> 8) & 0xff;
    // this.rng_state[3] = (seed >> 0) & 0xff;
    // this.prevent_zero_state(); // TODO throw error on zero state instead of this which alters the state
    console.log('foo', this.rng_state)
  }

  prevent_zero_state() {
    for (let x = 16; x > 0; --x) {
      if (++this.rng_state[x - 1]) {
        break;
      }
    }
  }

  shuffle() {
    let carry = 0;
    for (let x = 15; x > 0; --x) {
      const result = this.rng_state[x - 1] + this.rng_state[x] + carry;
      this.rng_state[x - 1] = result & 0xff; // keep only the lower 8 bits
      carry = result >> 8; // get the carry (upper 8 bits)
    }
  }

  getRandomArray(length: number) {
    const result = new Uint32Array(length);
    for (let i = 0; i < result.length; i++) {
      result[i] = this.random_int();
    }
    return result;
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
    return this.rng_state;
  }

  random_int(): number {
    this.shuffle();
    this.prevent_zero_state();

    const value =
      (this.rng_state[0] << 24) |
      (this.rng_state[1] << 16) |
      (this.rng_state[2] << 8) |
      this.rng_state[3];
    return value >>> 0;
  }

  random_byte(): number {
    this.shuffle();

    this.prevent_zero_state();

    return this.rng_state[0];
  }
}

function getMapOfSeed(seed: Uint8Array) {
  console.log("getMapOfSeed", seed);
  const data = new Float32Array(width * height * channels);
  // const generator = new MersenneTwister(seed);
  const generator = new PRNG(seed);

  for (let i = 0; i < width * height; i++) {
    data[i] = generator.random_int();
  }
  return data;
}

function getMapAtLocation(location: number[][]) {
  let data = getMapOfSeed(seed);
  // for (let i = 0; i < location.length; i++) {
  //   const seedAtCoord = data[location[i][1] * width + location[i][0]];
  //   data = getMapOfSeed(seedAtCoord);
  // }
  return data;
}

function render(context: CanvasRenderingContext2D | null) {
  if (!context) return;

  // context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  // const location = [
  //   [0, 0],
  //   // [0, 0],
  //   // [0, 0],
  // ];
  // const data = getMapAtLocation(location);

  // const imageData = context.getImageData(0, 0, width, height);
  // const pixelData = imageData.data;
  // for (let y = 0; y < height; y++) {
  //   for (let x = 0; x < width; x++) {
  //     const i = y * width + x;
  //     const o = (y * width + x) * channels;

  //     pixelData[o + 0] = data[i] & 255;
  //     pixelData[o + 1] = (data[i] >> 8) & 255;
  //     pixelData[o + 2] = (data[i] >> 16) & 255;
  //     pixelData[o + 3] = (data[i] >> 24) & 255;
  //   }
  // }

  // context.putImageData(imageData, 0, 0);
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
