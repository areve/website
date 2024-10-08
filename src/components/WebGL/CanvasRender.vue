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
      {{ model.frame.toFixed(2) }})
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, toRaw } from "vue";
import { RenderModel, RenderService, FrameUpdated } from "./lib/render";

interface CanvasRenderProps {
  model: RenderModel;
  renderService: RenderService;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<CanvasRenderProps>();

const fps = ref(0);
const ratePixelsPerSecond = ref(0);

let lastState: string;
let busy = false;

let frame: number;

let lastAnimFrame = 0;
const update = async (animFrame: number) => {
  if (busy) return next();
  if (!props.model.selected) return (lastAnimFrame = animFrame), next();
  if (!props.model.paused) {
    props.model.frame += (animFrame - lastAnimFrame) * 0.01;
  }
  lastAnimFrame = animFrame;
  const state = JSON.stringify(toRaw(props.model));
  if (state === lastState) return next();
  lastState = state;
  busy = true;
  await props.renderService.update(props.model);
  await new Promise((resolve) => setTimeout(resolve, 40))
  next();
};

const next = () => (frame = requestAnimationFrame(update));

const frameUpdated = (frameUpdated: FrameUpdated) => {
  const pixels = props.model.dimensions.height * props.model.dimensions.width;
  ratePixelsPerSecond.value = pixels / frameUpdated.timeTaken;
  fps.value = 1 / frameUpdated.timeTaken;
  busy = false;
};

onMounted(async () => {
  await props.renderService.init(canvas.value, props.model);
  props.renderService.frameUpdated = frameUpdated;
  next();
});

onUnmounted(() => {
  cancelAnimationFrame(frame);
});
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
./lib/render
