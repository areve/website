<template>
  <section>
    <div
      class="canvas-wrap"
      :style="{
        height: props.model.dimensions.height + 'px',
        width: props.model.dimensions.width + 'px',
      }"
    >
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <div class="noise-render-slot caption">
      <slot></slot> ({{
        (ratePixelsPerSecond / 1000000).toPrecision(3)
      }}
      Mpix/sec, FPS:{{ fps.toPrecision(2) }}) (seed: {{ model.seed }}, frame:
      {{ model.frame }})
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref } from "vue";
import {
  FrameUpdated,
  RenderModel,
  RenderService,
} from "./lib/MultiThreadedRender";

interface CanvasRenderProps {
  model: RenderModel;
  renderService: RenderService;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<CanvasRenderProps>();

const fps = ref(0);
const ratePixelsPerSecond = ref(0);

let busy = false;
const update = () => {
  if (busy) return;
  if (!props.model.selected) return;
  busy = true;
  props.renderService.update(props.model);
};

const frameUpdated = (frameUpdated: FrameUpdated) => {
  const pixels = props.model.dimensions.height * props.model.dimensions.width;
  ratePixelsPerSecond.value = pixels / frameUpdated.timeTaken;
  fps.value = 1 / frameUpdated.timeTaken;
  busy = false;
};

onMounted(() => {
  props.renderService.init(canvas.value, props.model);
  props.renderService.frameUpdated = frameUpdated;
  update();
});
onUpdated(update);
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  border: 2px solid #666;
  display: inline-block;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  border: 0px solid #999;
}
.caption {
  margin-top: -0.5em;
  font-size: 0.9em;
  font-style: italic;
}
</style>

<style>
.noise-render-slot h1 {
  font-size: 1em;
  font-weight: 400;
}
</style>
