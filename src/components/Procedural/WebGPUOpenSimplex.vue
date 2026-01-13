<template>
  <div ref="container" class="canvas-container">
    <canvas ref="canvas" class="canvas"></canvas>

    <!-- Compass overlay: circular 50px compass with rotating SVG needle -->
    <button
      ref="compass"
      type="button"
      class="compass"
      aria-label="Reset rotation (click) — double-click to show controls"
      @click.stop="resetRotation"
      @keydown.enter.prevent="resetRotation"
      @dblclick.stop="toggleControls"
    >
      <div
        class="compass-pointer"
        :style="{ transform: compassRotation }"
        role="img"
        aria-hidden="true"
      ></div>
    </button>

    <div :class="['controls-overlay', { 'controls-hidden': !controlsVisible }]">
      <div class="stats">
        {{ stats.fps.toPrecision(3) }}fps {{ controller.x.toFixed(1) }}x
        {{ controller.y.toFixed(1) }}y {{ controller.z.toFixed(1) }}z
        {{ controller.zoom.toFixed(2) }}zoom
        {{ controller.rotation.toFixed(1) }}rot
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
            <option value="mountains3d">Mountains3D</option>
          </select>
        </label>
        <label class="mode-select">
          Zoom Centre:
          <select v-model="zoomOrigin">
            <option value="pointer">Mouse</option>
            <option value="center">Center</option>
          </select>
        </label>
        <button @click="handleToggleFullscreen" type="button">
          Fullscreen
        </button>
            <!-- Close button: hides controls overlay -->
            <button class="controls-close" type="button" @click.stop="hideControls" aria-label="Hide controls">✕</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";
import { makeController3d } from "./lib/controller3d";
import { setupOpenSimplexRenderer } from "./renderer/setupOpenSimplexRenderer";
import { setupMandelbrotRenderer } from "./renderer/setupMandelbrotRenderer";
import { setupRippleRenderer } from "./renderer/setupRippleRenderer";
import { setupWorleyRenderer } from "./renderer/setupWorleyRenderer";
import { setupMountainsRenderer } from "./renderer/setupMountainsRenderer";
import { setupMountains3DRenderer } from "./renderer/setupMountains3DRenderer";

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

const controller3D = makeController3d();

// Rotation for the compass pointer (degrees, inverted so pointer indicates "up"/north)
const compassRotation = computed(() => {
  // controller is a ref; use .value here in script
  const rad = controller.value.rotation ?? 0;
  const deg = (-rad * 180) / Math.PI;
  return `rotate(${deg}deg)`;
});

let _rotationAnim: number | null = null;

function normalizeAngle(a: number) {
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

function resetRotation() {
  // Smoothly animate rotation back to 0 using requestAnimationFrame
  // Cancel any existing animation first.
  if (_rotationAnim) {
    cancelAnimationFrame(_rotationAnim);
    _rotationAnim = null;
  }

  const start = controller.value.rotation ?? 0;
  // shortest delta to zero
  const delta = normalizeAngle(0 - start);
  const duration = 220; // ms
  const t0 = performance.now();

  function step(now: number) {
    const elapsed = now - t0;
    const t = Math.min(1, elapsed / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    controller.value.rotation = start + delta * eased;
    if (t < 1) {
      _rotationAnim = requestAnimationFrame(step);
    } else {
      controller.value.rotation = 0;
      _rotationAnim = null;
    }
  }

  _rotationAnim = requestAnimationFrame(step);
}
// Controls visibility
const controlsVisible = ref(false);

function hideControls() {
  controlsVisible.value = false;
}

function showControls() {
  controlsVisible.value = true;
}

function toggleControls() {
  controlsVisible.value = !controlsVisible.value;
}

const width = 500;
const height = 500;
const seed = 12345;
const shaderMode = ref<
  "simplex" | "ripple" | "mandelbrot" | "worley" | "mountains" | "mountains3d"
>("mountains3d");

let frameId: number = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const availableModes = [
  "simplex",
  "ripple",
  "mandelbrot",
  "worley",
  "mountains",
  "mountains3d",
] as const;

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
  } else if (shaderMode.value === "mountains3d") {
    renderer = await setupMountains3DRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    }, controller3D);
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
  controller3D.value.mount(canvas.value);
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
  if (_rotationAnim) {
    cancelAnimationFrame(_rotationAnim);
    _rotationAnim = null;
  }
  controller.value.unmount();
  controller3D.value.unmount();
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

/* Controls overlay positioned as a semi-transparent bar across the bottom
   of the canvas so it remains visible in fullscreen. */
.controls-overlay {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  /* reserve space on the right so the close button does not overlap the
     fullscreen button (close sits in the overlay's top-right corner) */
  padding: 0.5rem  calc(0.75rem + 44px) 0.5rem 0.75rem;
  background: rgba(0,0,0,0.45);
  color: #fff;
  border-radius: 8px;
  z-index: 25;
  backdrop-filter: blur(4px);
  /* allow clicks on controls */
  pointer-events: auto;
  /* Default (non-fullscreen): fade in/out */
  transform: none;
  opacity: 1;
  transition: opacity 200ms ease;
}

.controls-overlay .stats {
  font-family: monospace;
  font-size: 0.9rem;
}

/* Close button inside controls overlay */
.controls-close {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.12);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  position: absolute;
  top: 8px;
  right: 8px;
}
.controls-close:active { transform: scale(0.96); }

/* Hidden (non-fullscreen): fade only */
.controls-hidden {
  opacity: 0;
  pointer-events: none;
}

/* When the canvas container is fullscreen, slide the overlay off the bottom.
   Use both standard and vendor-prefixed fullscreen selectors for compatibility. */
.canvas-container:fullscreen .controls-overlay,
.canvas-container:-webkit-full-screen .controls-overlay,
.canvas-container:-moz-full-screen .controls-overlay {
  transform: translateY(0);
  transition: transform 260ms cubic-bezier(.22,.9,.32,1), opacity 200ms ease;
}
.canvas-container:fullscreen .controls-hidden,
.canvas-container:-webkit-full-screen .controls-hidden,
.canvas-container:-moz-full-screen .controls-hidden {
  transform: translateY(110%);
  opacity: 0;
  pointer-events: none;
}

/* Compass overlay styles */
button.compass {
  position: absolute;
  top: 1em;
  right: 1em;
  width: 4em;
  height: 4em;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  cursor: pointer;
}
.compass:focus {
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
} 

.compass-pointer {
  width: 3em;
  height: 3em;
  display: block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  background-image: url("./needle.svg");
  transform-box: fill-box;
  transform-origin: 50% 50%;
  pointer-events: none;
  opacity: 0.8;
}
</style>
