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
import { onMounted, ref, toRaw, watch } from "vue";
import {
  RenderModel,
  RenderService,
  RenderServiceConstructor,
} from "./world/WorldRender";
import { FrameUpdated } from "./world/WorldRenderWorker";

interface CanvasRenderProps {
  model: RenderModel;
  RenderService?: RenderServiceConstructor;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<CanvasRenderProps>();

const fps = ref(0);
const ratePixelsPerSecond = ref(0);

let renderService: RenderService;

const frameUpdated = (frameUpdated: FrameUpdated) => {
  const pixels = props.model.dimensions.height * props.model.dimensions.width;
  ratePixelsPerSecond.value = pixels / frameUpdated.timeTaken;
  fps.value = 1 / frameUpdated.timeTaken;
};

const update = () => {
  if (!renderService && props.RenderService) {
    renderService = new props.RenderService(canvas.value, props.model);
    renderService.frameUpdated = frameUpdated;
  } else {
    renderService.update(props.model);
  }
};

onMounted(update);
watch([props.model], update);
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
