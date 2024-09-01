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
        <CanvasRender
          :render="noise"
          @click="select(noise, $event)"
          v-model:frame="frame"
          
          >{{ noise.title }} (seed: {{ seed }}, frame:
          {{ frame }})</CanvasRender
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
import CanvasRender from "./CanvasRender.vue";

import { makeWorld, RenderProps } from "./world/WorldRender";

const seed = ref(12345);
const frame = ref(0);

const noises = ref<RenderProps[]>([makeWorld(seed.value)]);

function sss(a: any){
  console.log('aa', a)
}
function select(noise: RenderProps, event: MouseEvent) {
  if (!event.ctrlKey) {
    const selectedOthers = noises.value.filter(
      (v) => v.selected && v !== noise
    );
    selectedOthers.forEach((v) => (v.selected = false));
  }
  noise.selected = !noise.selected;
}

onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
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
  background-color: rgba(0, 0, 255, 0.05);
  box-shadow: inset 0 0 0.2em rgba(0, 0, 0, 0.25);
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
