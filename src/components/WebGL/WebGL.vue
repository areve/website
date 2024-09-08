<template>
  <article>
    <h1>WebGL</h1>
    <p>
      WebGL (and WebGPU) is a technology to render 3D on the web. Here are some experiments I
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
import { scene1 } from "./lib/scene1";
import { scene2 } from "./lib/scene2";
import { scene3 } from "./lib/scene3";
import CanvasRender from "./CanvasRender.vue";

const renderSetups = ref<RenderSetup[]>([scene3, scene1, scene2]);

</script>
<style scoped></style>
