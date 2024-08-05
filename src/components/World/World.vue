<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>

    <div class="canvas-wrap">
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref, watchEffect } from "vue";

import MersenneTwister from "mersenne-twister";

const canvas = ref<HTMLCanvasElement>(undefined!);

interface Props {
  // seed: 0;
}
const props = defineProps<Props>();

const width = 256;
const height = 256;
const channels = 4;

onMounted(async () => {
  render(getContext());
});


function getMapOfSeed(seed: number) {
  console.log('getMapOfSeed', seed)
  const data = new Float32Array(width * height * channels);
  const generator = new MersenneTwister(seed);

  for (let i = 0; i < width * height; i++) {
    data[i] = generator.random_int();
  }
  return data

}
function getMapAtLocation(location: number[][]) {
  let data = getMapOfSeed(0);
  for(let i = 0; i < location.length; i++){
    const seedAtCoord = data[location[i][1] * width + location[i][0]]
    data = getMapOfSeed(seedAtCoord)
  }
  return data
}

function render(context: CanvasRenderingContext2D | null) {
  if (!context) return;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  const location = [[0,0], [0,0], [0,0]]
  const data = getMapAtLocation(location);

  const imageData = context.getImageData(0, 0, width, height);
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
