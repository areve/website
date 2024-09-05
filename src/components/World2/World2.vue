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
        v-for="renderSetup in renderSetups"
        :class="{
          selected: renderSetup.model.selected,
        }"
        class="panel"
      >
        <CanvasRender
          v-model:model="renderSetup.model"
          :renderService="renderSetup.renderService()"
          @click="select(renderSetup, $event)"
          >{{ renderSetup.model.title }}</CanvasRender
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
import { makeWorld } from "./world/WorldRender";
import { RenderSetup } from "./lib/MultiThreadedRender";
import { bindController, keyPressed, unbindController } from "./lib/controller";

const seed = ref(12345);

const renderSetups = ref<RenderSetup[]>([makeWorld(seed.value)]);

function select(renderSetup: RenderSetup, event: MouseEvent) {
  if (!event.ctrlKey) {
    const selectedOthers = renderSetups.value.filter(
      (v) => v.model.selected && v !== renderSetup
    );
    selectedOthers.forEach((v) => (v.model.selected = false));
  }
  renderSetup.model.selected = !renderSetup.model.selected;
}

let controllerCheck: number;

function update() {
  controllerCheck = requestAnimationFrame(handleController);
}

onMounted(async () => {
  bindController();
  document.addEventListener("keypress", onKeyPress);
  update();
});

onUnmounted(() => {
  unbindController();
  document.removeEventListener("keypress", onKeyPress);
  // cancelAnimationFrame(frameId);
  cancelAnimationFrame(controllerCheck);
});

let then = 0;
const handleController = (now: number) => {
  const diff = (now - then) / 1000;
  renderSetups.value
    .filter((v) => v.model.selected)
    .forEach((v) => {
      const zoom = v.model.camera.zoom;
      if (keyPressed("a")) v.model.camera.x -= 200 * zoom * diff;
      if (keyPressed("d")) v.model.camera.x += 200 * zoom * diff;
      if (keyPressed("w")) v.model.camera.y -= 200 * zoom * diff;
      if (keyPressed("s")) v.model.camera.y += 200 * zoom * diff;
      if (keyPressed("'")) v.model.camera.zoom /= (1 + 0.5 * diff);
      if (keyPressed("/")) v.model.camera.zoom *= (1 + 0.5 * diff);
      if (keyPressed("t")) v.model.dimensions.height += Math.floor(200 * diff);
      if (keyPressed("g")) v.model.dimensions.height -= Math.floor(200 * diff);
      if (keyPressed("h")) v.model.dimensions.width += Math.floor(200 * diff);
      if (keyPressed("f")) v.model.dimensions.width -= Math.floor(200 * diff);
      if (v.model.dimensions.height < 50) v.model.dimensions.height = 50;
      if (v.model.dimensions.width < 50) v.model.dimensions.width = 50;
    });

  then = now;
  controllerCheck = requestAnimationFrame(handleController);
};
const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === "a" && event.ctrlKey)
    return renderSetups.value.forEach((v) => (v.model.selected = true));
  if (event.key === "j")
    return renderSetups.value.forEach(
      (v) => (v.model.frame = (Math.random() * 0xffffffff) | 0)
    );
  if (event.key === "k") renderSetups.value.forEach((v) => (v.model.frame = 0));
  if (event.key === "p")
    renderSetups.value
      .filter((v) => v.model.selected)
      .forEach((v) => (v.model.paused = !v.model.paused));
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
