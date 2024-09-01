<template>
  <section>
    <div
      class="canvas-wrap"
      :style="{
        height: props.render.dimensions.height + 'px',
        width: props.render.dimensions.width + 'px',
      }"
    >
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
    <div class="noise-render-slot caption">
      <slot></slot> ({{ (ratePixelsPerSecond / 1000000).toPrecision(3) }}
      Mpix/sec)
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref, toRaw, watch } from "vue";
import { Dimensions, Camera } from "./lib/render";
import { Rgb } from "./lib/color";
import { RenderProps, RenderService } from "./world/WorldRender";
import { FrameUpdated } from "./world/WorldRenderWorker";

export interface NoiseRenderProps {
  render: RenderProps;
}

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<NoiseRenderProps>();
const ratePixelsPerSecond = ref(0);

let renderService: RenderService;
const update = () => {
  if (!renderService && props.render.renderService) {
    renderService = new props.render.renderService(canvas.value, props.render);
    renderService.frameUpdated = (frameUpdated: FrameUpdated) => {
      const pixels =
        props.render.dimensions.height * props.render.dimensions.width;
      ratePixelsPerSecond.value = pixels / frameUpdated.timeTaken;

      // TODO can't do this or we have an update loop
      // props.render.frame = frameUpdated.frame
    };
  } else {
    console.log("here");
    renderService.update(props.render);
  }
};

onMounted(update);
watch(props, update);
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
