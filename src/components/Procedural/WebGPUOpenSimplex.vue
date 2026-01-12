<template>
  <div ref="container" class="canvas-container">
    <canvas ref="canvas" class="canvas"></canvas>

    <!-- Compass overlay: circular 50px compass with rotating pointer -->
    <div class="compass" aria-hidden="true">
      <div class="compass-pointer" :style="{ transform: compassRotation }"></div>
    </div>

    <div class="controls-overlay">
    <div class="stats">
      {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
      {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
      {{ controller.zoom.toFixed(2) }}zoom
      <span v-if="controller.paused">paused</span>
    </div>
    <div>
      <label class="mode-select">
        Mode:
        <select @change="initializeCanvas" v-model="shaderMode">
          <option value="simplex">OpenSimplex</option>
          <option value="ripple">Ripple</option>
          <option value="mandelbrot">Mandelbrot</option>
          <option value="worley">Worley</option>
          <option value="mountains">Mountains</option>
        </select>
      </label>
      <label class="mode-select">
        Zoom Centre:
        <select v-model="zoomOrigin">
          <option value="pointer">Mouse</option>
          <option value="center">Center</option>
        </select>
      </label>
      <button @click="handleToggleFullscreen" type="button">Fullscreen</button>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";
import { setupOpenSimplexRenderer } from "./renderer/setupOpenSimplexRenderer";
import { setupMandelbrotRenderer } from "./renderer/setupMandelbrotRenderer";
import { setupRippleRenderer } from "./renderer/setupRippleRenderer";
import { setupWorleyRenderer } from "./renderer/setupWorleyRenderer";
import { setupMountainsRenderer } from "./renderer/setupMountainsRenderer";

const canvas = ref<HTMLCanvasElement>(undefined!);
const container = ref<HTMLElement>(undefined!);
const stats = makeStats();
const zoomOrigin = ref<"pointer" | "center">("center");
const controller = makeController({
  basicKeys: {
    pause: { startPaused: false },
  },
  acceleratorKeys: {
    zoom: {
      origin: () => zoomOrigin.value,
    },
  },
});

// Rotation for the compass pointer (degrees, inverted so pointer indicates "up"/north)
const compassRotation = computed(() => {
  // controller is a ref; use .value here in script
  const rad = controller.value.rotation ?? 0;
  const deg = (-rad * 180) / Math.PI;
  return `rotate(${deg}deg)`;
});
const width = 500;
const height = 500;
const seed = 12345;
const shaderMode = ref<"simplex" | "ripple" | "mandelbrot" | "worley" | "mountains">("mountains");

let frameId: number = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const availableModes = ["simplex", "ripple", "mandelbrot", "worley", "mountains"] as const;

const handleChangeMode = async () => {
  const idx = availableModes.indexOf(shaderMode.value);
  const next = availableModes[(idx + 1) % availableModes.length];
  shaderMode.value = next;
  await initializeCanvas();
};

const handleToggleFullscreen = () => {
  const el = container.value || canvas.value;

  if (!document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {
      console.warn("Failed to enter fullscreen mode");
    });
  } else {
    document.exitFullscreen?.();
  }
};

const initializeCanvas = async () => {
  const isFs = !!document.fullscreenElement;
  const newWidth = isFs ? window.innerWidth : width;
  const newHeight = isFs ? window.innerHeight : height;

  if (shaderMode.value === "mandelbrot") {
    renderer = await setupMandelbrotRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (shaderMode.value === "ripple") {
    renderer = await setupRippleRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (shaderMode.value === "worley") {
    renderer = await setupWorleyRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (shaderMode.value === "mountains") {
    renderer = await setupMountainsRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else {
    renderer = await setupOpenSimplexRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  }
  await renderer.init();
};

onMounted(async () => {
  controller.value.mount(canvas.value);
  await initializeCanvas();
  await renderer.update(0, controller.value);

  document.addEventListener("changeMode", handleChangeMode);
  document.addEventListener("toggleFullscreen", handleToggleFullscreen);
  document.addEventListener("fullscreenchange", initializeCanvas);

  const render = async (time: DOMHighResTimeStamp) => {
    if (!controller.value.paused) {
      await renderer.update(time, controller.value);
      controller.value.update();
      stats.value.update();
    }
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  document.removeEventListener("changeMode", handleChangeMode);
  document.removeEventListener("toggleFullscreen", handleToggleFullscreen);
  document.removeEventListener("fullscreenchange", initializeCanvas);
  cancelAnimationFrame(frameId);
  controller.value.unmount();
});
</script>

<style scoped>
.canvas {
  touch-action: none;
}

.canvas-container {
  position: relative;
  display: inline-block;
}

.canvas-container .canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Compass overlay styles */
.compass {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.08);
}

.compass-pointer {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 18px solid #ffffffcc;
  transform-origin: center 60%;
}
</style>
