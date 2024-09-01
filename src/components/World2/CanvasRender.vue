<template>
  <section>
    <div
      class="canvas-wrap"
      :style="{
        height: props.dimensions.height + 'px',
        width: props.dimensions.width + 'px',
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
import {
  RenderProps,
  RenderService,
  RenderServiceConstructor,
} from "./world/WorldRender";
import { FrameUpdated } from "./world/WorldRenderWorker";

export interface NoiseRenderProps {
  title: string;
  seed: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  RenderService?: RenderServiceConstructor;
  frame: number;
}

// TODO update vue and use `defineModel`
const emit = defineEmits(["update:frame"]);

const canvas = ref<HTMLCanvasElement>(undefined!);
const props = defineProps<NoiseRenderProps>();

const ratePixelsPerSecond = ref(0);

let renderService: RenderService;
const update = () => {
  if (!renderService && props.RenderService) {
    // TODO need better types so I don't have to create an object like this
    renderService = new props.RenderService(canvas.value, {
      title: toRaw(props.title),
      seed: toRaw(props.seed),
      dimensions: toRaw(props.dimensions),
      camera: toRaw(props.camera),
      selected: toRaw(props.selected),
      frame: toRaw(props.frame),
    });
    renderService.frameUpdated = (frameUpdated: FrameUpdated) => {
      const pixels = props.dimensions.height * props.dimensions.width;
      ratePixelsPerSecond.value = pixels / frameUpdated.timeTaken;

      // TODO can't do this or we have an update loop
      // props.render.frame = frameUpdated.frame
      // const doo = JSON.parse(JSON.stringify(props.render)) as RenderProps;
      // doo.frame = frameUpdated.frame;
      emit("update:frame", frameUpdated.frame);
    };
  } else {
    console.log("here");
    renderService.update({
      title: toRaw(props.title),
      seed: toRaw(props.seed),
      dimensions: toRaw(props.dimensions),
      camera: toRaw(props.camera),
      selected: toRaw(props.selected),
      frame: toRaw(props.frame),
    });
  }
};

onMounted(update);
watch([props.dimensions, props.frame], update);
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
