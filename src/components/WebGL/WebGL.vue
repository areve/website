<template>
  <article>
    <h1>WebGL</h1>
    <p>
      WebGL is a technology to render 3D on the web. Here are some experiments I
      did, using different methods to render fairly primitive objects.
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
          >{{ renderSetup.model.title }}</CanvasRender
        >
      </div>
    </div>
  </article>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { RenderSetup } from "./lib/render";
import { makeSphere1RenderSetup } from "./lib/sphere1";
import { makeSphere2RenderSetup } from "./lib/sphere2";
import CanvasRender from "./CanvasRender.vue";

const renderSetups = ref<RenderSetup[]>([
  makeSphere1RenderSetup(),
  makeSphere2RenderSetup(),
]);
</script>
<style scoped></style>
