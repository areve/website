<template>
  <section>
    <h1>World 3D</h1>
    <p>A pseudo random number generated world map in 3D</p>
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
import { makeWorld, RenderSetup } from "./world/render";

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

let frameId: number;

function update() {
  renderSetups.value
    .filter((v) => v.model.selected)
    .forEach((v) => ++v.model.frame);
  frameId = requestAnimationFrame(update);
}
onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
  update();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
  cancelAnimationFrame(frameId);
});

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "a" && event.ctrlKey)
    return renderSetups.value.forEach((v) => (v.model.selected = true));
  if (event.key === "j")
    return renderSetups.value.forEach(
      (v) => (v.model.frame = (Math.random() * 0xffffffff) | 0)
    );
  if (event.key === "k") renderSetups.value.forEach((v) => (v.model.frame = 0));
  if (event.key === "p")
    renderSetups.value.forEach((v) => (v.model.selected = !v.model.selected));

  renderSetups.value
    .filter((v) => v.model.selected)
    .forEach((v) => {
      const zoom = v.model.camera.zoom;
      if (event.key === "a") v.model.camera.x -= 25 * zoom;
      if (event.key === "d") v.model.camera.x += 25 * zoom;
      if (event.key === "w") v.model.camera.y -= 25 * zoom;
      if (event.key === "s") v.model.camera.y += 25 * zoom;
      if (event.key === "'") v.model.camera.zoom /= 1.2;
      if (event.key === "/") v.model.camera.zoom *= 1.2;
      if (event.key === "t") v.model.dimensions.height += 50;
      if (event.key === "g") v.model.dimensions.height -= 50;
      if (event.key === "h") v.model.dimensions.width += 50;
      if (event.key === "f") v.model.dimensions.width -= 50;

      if (v.model.dimensions.height < 50) v.model.dimensions.height = 50;
      if (v.model.dimensions.width < 50) v.model.dimensions.width = 50;
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
