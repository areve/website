<template>
  <section>
    <h1>World</h1>
    <p>A pseudo random number generated world map</p>
    <p>
      Key board shortcuts include, pan: W A S D, resize: T F G H, zoom: ' /
      <br />
      J K frame randomize and reset, P or click to pause
    </p>
    <div class="panels">
      <div
        v-for="noise in noises"
        :class="{
          selected: noise.selected,
        }"
        class="panel"
      >
        <NoiseRender :render="noise" @click="select(noise, $event)"
          >{{ noise.title }} (seed: {{ seed }}, frame:
          {{ noise.frame }})</NoiseRender
        >
      </div>
      <div class="panel">
        <div class="photo">
          <img
            src="./assets/New-global-view.width-1000.format-webp.webp"
            width="500"
            height="200"
          />
        </div>
        <div class="caption">Photo map for reference</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import NoiseRender from "./NoiseRender.vue";
import { Rgb } from "./lib/color";
import { Camera, Dimensions } from "./lib/render";
import { makeWorld, RenderProps } from "./world/WorldRenderService";

const seed = ref(12345);

interface NoiseDefinition {
  dimensions: Dimensions;
  camera: Camera;
  title: string;
  pixel: (x: number, y: number) => Rgb;
  frame: number;
  selected: boolean;
}

const noises = ref<RenderProps[]>([makeWorld(seed.value)]);

function select(noise: RenderProps, event: MouseEvent) {
  if (!event.ctrlKey) {
    const selectedOthers = noises.value.filter(
      (v) => v.selected && v !== noise
    );
    selectedOthers.forEach((v) => (v.selected = false));
  }
  noise.selected = !noise.selected;
}

let frameId: number | null = null;

const update = () => {
  noises.value.filter((v) => v.selected).forEach((v) => ++v.frame);
  frameId = requestAnimationFrame(update);
};

onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
  update();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
  if (frameId) cancelAnimationFrame(frameId);
  frameId = null;
});

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "a" && event.ctrlKey)
    return noises.value.forEach((v) => (v.selected = true));
  if (event.key === "j")
    return noises.value.forEach(
      (v) => (v.frame = (Math.random() * 0xffffffff) | 0)
    );
  if (event.key === "k") noises.value.forEach((v) => (v.frame = 0));
  if (event.key === "p")
    noises.value.forEach((v) => (v.selected = !v.selected));

  noises.value
    .filter((v) => v.selected)
    .forEach((v) => {
      const zoom = v.camera.zoom;
      if (event.key === "a") v.camera.x -= 25 * zoom;
      if (event.key === "d") v.camera.x += 25 * zoom;
      if (event.key === "w") v.camera.y -= 25 * zoom;
      if (event.key === "s") v.camera.y += 25 * zoom;
      if (event.key === "'") v.camera.zoom /= 1.2;
      if (event.key === "/") v.camera.zoom *= 1.2;
      if (event.key === "t") v.dimensions.height += 50;
      if (event.key === "g") v.dimensions.height -= 50;
      if (event.key === "h") v.dimensions.width += 50;
      if (event.key === "f") v.dimensions.width -= 50;

      if (v.dimensions.height < 50) v.dimensions.height = 50;
      if (v.dimensions.width < 50) v.dimensions.width = 50;
    });

  console.log(event.key);
};
</script>

<style>
#app {
  user-select: none;
}
</style>
<style scoped>
.panels {
  display: flex;
  flex-wrap: wrap;
}
.panel {
  padding: 0.25em;
  margin: 0.25em;
  width: min-content;
}
.selected {
  /* background-color: rgba(0, 0, 255, 0.05); */
  /* box-shadow: inset 0 0 0.2em rgba(0, 0, 0, 0.25); */
}
.photo {
  min-width: 500px;
  min-height: 200px;
}

.caption {
  font-size: 0.9em;
  font-style: italic;
}
</style>
