<template>
  <div class="top-menu">
    <button @click="handleToggleFullscreen" type="button">
      Fullscreen
    </button>
  </div>
  
  <div ref="container" class="canvas-container">
    <canvas ref="canvas" class="canvas"></canvas>

    <!-- Compass overlay: circular 50px compass with rotating SVG needle -->
    <button
      v-show="compassVisible"
      ref="compass"
      type="button"
      class="compass"
      aria-label="Reset rotation (click)"
      @click.stop="resetRotation"
      @keydown.enter.prevent="resetRotation"
    >
      <div
        class="compass-pointer"
        :style="{ transform: compassRotation }"
        role="img"
        aria-hidden="true"
      ></div>
    </button>

    <!-- Controls button overlay: circular button to show controls -->
    <button
      ref="controlsButton"
      :class="['controls-button', { 'controls-button-hidden': controlsVisible }]"
      type="button"
      aria-label="Show controls"
      @click.stop="onControlsButtonClick"
      @keydown.enter.prevent="onControlsButtonClick"
      @pointerdown.stop.prevent="startDragControlsButton"
      :style="{ top: controlsButtonTop + 'px' }"
    ></button>

    <div :class="['controls-overlay', { 'controls-hidden': !controlsVisible }]">
      <div class="stats">
        {{ stats.fps.toPrecision(3) }}fps {{ statsX }}x {{ statsY }}y
        {{ statsZ }}z {{ statsZoom }}zoom {{ statsRot }}rot
        <span v-if="statsPaused">paused</span>
      </div>
      <div>
        <label class="mode-select">
          Mode:
          <select @change="initializeCanvas" v-model="shaderMode">
            <option value="simplex">OpenSimplex</option>
            <option value="opensimplex2">OpenSimplex2</option>
            <option value="opensimplex2s">OpenSimplex2S</option>
            <option value="perlin">Perlin</option>
            <option value="value">Value</option>
            <option value="fractal">Fractal</option>
            <option value="julia">Julia</option>
            <option value="lorenz">Lorenz</option>
            <option value="sierpinski">Sierpinski</option>
            <option value="trigonometry">Trigonometry</option>
            <option value="valuecubic">Value Cubic</option>
            <option value="newton">Newton Raphson</option>
            <option value="ripple">Ripple</option>
            <option value="mandelbrot">Mandelbrot</option>
            <option value="worley">Worley</option>
            <option value="mountains">Mountains</option>
            <option value="opensimplex3d">OpenSimplex 3D</option>
            <option value="flowfield">Flow Field</option>
            <option value="mountains3d">Mountains 3D</option>
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
        <label
          v-if="shaderMode === 'mountains3d' || shaderMode === 'opensimplex3d'"
          class="mode-select"
        >
          Controller:
          <select
            v-model="controllerMode"
            @change="setControllerMode(controllerMode)"
          >
            <option value="2d">2D Controller (texture)</option>
            <option value="3d">3D Controller (camera)</option>
          </select>
        </label>
        <button @click="compassVisible = !compassVisible" type="button">
          {{ compassVisible ? 'Hide' : 'Show' }} Compass
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed, nextTick } from "vue";
import { makeStats } from "./lib/stats";
import { makeController } from "./lib/controller";
import { makeController3d } from "./lib/controller3d";
import { setupOpenSimplexRenderer } from "./renderer/setupOpenSimplexRenderer";
import { setupOpenSimplex2Renderer } from "./renderer/setupOpenSimplex2Renderer";
import { setupOpenSimplex2SRenderer } from "./renderer/setupOpenSimplex2SRenderer";
import { setupPerlinRenderer } from "./renderer/setupPerlinRenderer";
import { setupValueRenderer } from "./renderer/setupValueRenderer";
import { setupFlowfieldRenderer } from "./renderer/Flowfield/Flowfield";
import { setupValueCubicRenderer } from "./renderer/setupValueCubicRenderer";
import { setupNewtonRenderer } from "./renderer/setupNewtonRenderer";
import { setupMandelbrotRenderer } from "./renderer/setupMandelbrotRenderer";
import { setupJuliaRenderer } from "./renderer/setupJuliaRenderer";
import { setupLorenzRenderer } from "./renderer/setupLorenzRenderer";
import { setupSierpinskiRenderer } from "./renderer/setupSierpinskiRenderer";
import { setupFractalRenderer } from "./renderer/setupFractalRenderer";
import { setupTrigonometryRenderer } from "./renderer/setupTrigonometryRenderer";
import { setupRippleRenderer } from "./renderer/setupRippleRenderer";
import { setupWorleyRenderer } from "./renderer/setupWorleyRenderer";
import { setupMountainsRenderer } from "./renderer/setupMountainsRenderer";
import { setupOpenSimplex3dRenderer } from "./renderer/setupOpenSimplex3dRenderer";
import { setupMountains3dRenderer } from "./renderer/setupMountains3dRenderer";

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

const controller3d = makeController3d();
const controllerMode = ref<"2d" | "3d">("2d");

function setControllerMode(mode: "2d" | "3d") {
  if (!canvas.value) return;
  if (mode === "3d") {
    controller.value.unmount();
    controller3d.value.mount(canvas.value);
    controllerMode.value = "3d";
  } else {
    controller3d.value.unmount();
    controller.value.mount(canvas.value);
    controllerMode.value = "2d";
  }
}

// Rotation for the compass pointer (degrees, inverted so pointer indicates "up"/north)
const compassRotation = computed(() => {
  // Use 3D yaw only when a 3D controller is active for 3D-capable modes
  const use3d =
    (shaderMode.value === "opensimplex3d" && controllerMode.value === "3d") ||
    (shaderMode.value === "mountains3d" && controllerMode.value === "3d");
  const rad = use3d
    ? (controller3d.value.yaw ?? 0)
    : (controller.value.rotation ?? 0);
  const deg = (-rad * 180) / Math.PI;
  return `rotate(${deg}deg)`;
});

// Which controller is currently active (object, not ref)
const activeController = computed(() => {
  if (shaderMode.value === "opensimplex3d") {
    return controllerMode.value === "3d"
      ? controller3d.value
      : controller.value;
  }
  if (shaderMode.value === "mountains3d" && controllerMode.value === "3d")
    return controller3d.value;
  return controller.value;
});

// Safe formatted stats for template (avoid calling toFixed on undefined)
const statsX = computed(() => {
  const c = activeController.value;
  const x = typeof c?.x === "number" ? c.x : c?.position ? c.position[0] : 0;
  return x.toFixed(1);
});
const statsY = computed(() => {
  const c = activeController.value;
  const y = typeof c?.y === "number" ? c.y : c?.position ? c.position[1] : 0;
  return y.toFixed(1);
});
const statsZ = computed(() => {
  const c = activeController.value;
  const z = typeof c?.z === "number" ? c.z : c?.position ? c.position[2] : 0;
  return z.toFixed(1);
});
const statsZoom = computed(() => {
  const c = activeController.value;
  if (typeof c?.zoom === "number") return c.zoom.toFixed(2);
  if (typeof c?.fov === "number") return c.fov.toFixed(2);
  return "0.00";
});
const statsRot = computed(() => {
  const c = activeController.value;
  if (typeof c?.rotation === "number") return c.rotation.toFixed(1);
  if (typeof c?.yaw === "number") return c.yaw.toFixed(1);
  return "0.0";
});
const statsPaused = computed(() => !!activeController.value?.paused);

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

  // Determine which controller to reset based on current mode
  const is3d = shaderMode.value === "opensimplex3d";
  const start = is3d
    ? (controller3d.value.yaw ?? 0)
    : (controller.value.rotation ?? 0);
  // shortest delta to zero
  const delta = normalizeAngle(0 - start);
  const duration = 220; // ms
  const t0 = performance.now();
  let lastAngle = start;

  function step(now: number) {
    const elapsed = now - t0;
    const t = Math.min(1, elapsed / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const newAngle = start + delta * eased;
    if (is3d) {
      // Use rotateAroundLook for incremental rotation
      const deltaStep = newAngle - lastAngle;
      controller3d.value.rotateAroundLook(deltaStep);
      lastAngle = newAngle;
    } else {
      controller.value.rotation = newAngle;
    }
    if (t < 1) {
      _rotationAnim = requestAnimationFrame(step);
    } else {
      if (is3d) {
        // Final adjustment to ensure we're exactly at 0
        const finalDelta = 0 - controller3d.value.yaw;
        controller3d.value.rotateAroundLook(finalDelta);
      } else {
        controller.value.rotation = 0;
      }
      _rotationAnim = null;
    }
  }

  _rotationAnim = requestAnimationFrame(step);
}
// Controls visibility
const controlsVisible = ref(false);
const compassVisible = ref(false);

// Controls button vertical position (pixels from top of container)
const controlsButton = ref<HTMLElement | null>(null);
const controlsButtonTop = ref<number>(0);
// Stored as fraction [0..1] of container height so position scales on resize/fullscreen
const controlsButtonPct = ref<number | null>(null);
let _dragging = false;
let _dragStartY = 0;
let _dragStartTop = 0;
let _didDrag = false;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function startDragControlsButton(e: PointerEvent) {
  if (!controlsButton.value || !container.value) return;
  _dragging = true;
  _dragStartY = e.clientY;
  _dragStartTop = controlsButtonTop.value ?? 0;
  try { controlsButton.value.setPointerCapture?.(e.pointerId); } catch {}
  e.preventDefault?.();
  window.addEventListener("pointermove", onPointerMove, { passive: false } as any);
  window.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(e: PointerEvent) {
  if (!_dragging || !container.value || controlsButtonTop.value == null || !controlsButton.value) return;
  e.preventDefault?.();
  const rect = container.value.getBoundingClientRect();

  const delta = e.clientY - _dragStartY;
  const newTop = clamp(_dragStartTop + delta, 0, rect.height);
  controlsButtonTop.value = newTop;
  // record relative position so it can be restored on resize/fullscreen
  if (rect.height > 0) controlsButtonPct.value = controlsButtonTop.value / rect.height;
  if (Math.abs(delta) > 4) _didDrag = true;
}

function onPointerUp(e: PointerEvent) {
  if (!container.value || !controlsButton.value) return;
  _dragging = false;
  try { controlsButton.value.releasePointerCapture?.(e.pointerId); } catch {}
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  // snap to corners if close
  const rect = container.value.getBoundingClientRect();
  const snapThreshold = 30;
  if (controlsButtonTop.value! <= snapThreshold) controlsButtonTop.value = 0;
  else if (controlsButtonTop.value! >= rect.height - snapThreshold) controlsButtonTop.value = rect.height;
  // update stored percentage after snapping
  if (rect.height > 0) controlsButtonPct.value = controlsButtonTop.value! / rect.height;
  // keep _didDrag true long enough to cancel the following click event, then clear
  setTimeout(() => { _didDrag = false; }, 0);
}

function onControlsButtonClick(e: Event) {
  if (_didDrag) {
    e.stopPropagation?.();
    return;
  }
  toggleControls();
}

function toggleControls() {
  controlsVisible.value = !controlsVisible.value;
}

const width = 500;
const height = 500;
const seed = 12345;
const shaderMode = ref<
  | "perlin"
  | "value"
  | "valuecubic"
  | "newton"
  | "julia"
  | "lorenz"
  | "sierpinski"
  | "fractal"
  | "trigonometry"
  | "opensimplex2"
  | "simplex"
  | "ripple"
  | "mandelbrot"
  | "worley"
  | "mountains"
  | "opensimplex3d"
  | "mountains3d"
  | "flowfield"
>("flowfield");

let frameId: number = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const availableModes = [
  "opensimplex2",
  "sierpinski",
  "trigonometry",
  "fractal",
  "opensimplex2s",
  "perlin",
  "simplex",
  "ripple",
  "mandelbrot",
  "worley",
  "mountains",
  "opensimplex3d",
  "mountains3d",
  "flowfield",
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
  const fsEl = document.fullscreenElement as HTMLElement | null;
  // Prefer the fullscreen element's client size (accounts for toolbars/OS chrome) when available
  const newWidth = isFs ? (fsEl?.clientWidth ?? window.innerWidth) : width;
  const newHeight = isFs ? (fsEl?.clientHeight ?? window.innerHeight) : height;

  // Ensure the canvas CSS size matches measured values so drawing matches onscreen aspect
  if (canvas.value) {
    canvas.value.style.width = `${newWidth}px`;
    canvas.value.style.height = `${newHeight}px`;
  }

  // Unmount both controllers before switching modes
  controller.value.unmount();
  controller3d.value.unmount();

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
  } else if (shaderMode.value === "opensimplex3d") {
    // Pass both controllers; renderer.update will receive the currently active controller
    renderer = await setupOpenSimplex3dRenderer(
      canvas.value,
      {
        width: newWidth,
        height: newHeight,
        seed,
      },
      controller,
      controller3d,
    );
    // Mount the currently selected controller (2D or 3D)
    if (canvas.value) {
      if (controllerMode.value === "2d") {
        controller.value.mount(canvas.value);
      } else {
        controller3d.value.mount(canvas.value);
      }
    }
  } else if (shaderMode.value === "opensimplex2") {
    renderer = await setupOpenSimplex2Renderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "perlin") {
    // Perlin renderer (copied from OpenSimplex variant) — useful for debugging.
    renderer = await setupPerlinRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "julia") {
    renderer = await setupJuliaRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "lorenz") {
    renderer = await setupLorenzRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "fractal") {
    renderer = await setupFractalRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "trigonometry") {
    renderer = await setupTrigonometryRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "sierpinski") {
    renderer = await setupSierpinskiRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "valuecubic") {
    renderer = await setupValueCubicRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "value") {
    renderer = await setupValueRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "flowfield") {
    renderer = await setupFlowfieldRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "newton") {
    renderer = await setupNewtonRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (shaderMode.value === "mountains3d") {
    // Pass both controllers; renderer will use controller3d for camera if present
    renderer = await setupMountains3dRenderer(
      canvas.value,
      {
        width: newWidth,
        height: newHeight,
        seed,
      },
      controller,
      controller3d,
    );
    // Mount the currently selected controller
    if (canvas.value) {
      if (controllerMode.value === "2d") {
        controller.value.mount(canvas.value);
      } else {
        controller3d.value.mount(canvas.value);
      }
    }
  } else {
    renderer = await setupOpenSimplexRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  }
  // For all non-3D modes, mount the 2D controller (covers simplex/ripple/worley/mountains)
  if (
    shaderMode.value !== "opensimplex3d" &&
    shaderMode.value !== "mountains3d"
  ) {
    if (canvas.value) {
      controller.value.mount(canvas.value);
    }
  }
  // Restore controls button position proportionally to the new container height
  if (container.value && controlsButton.value) {
    const rect = container.value.getBoundingClientRect();
    if (controlsButtonPct.value != null && rect.height > 0) {
      controlsButtonTop.value = clamp(Math.round(controlsButtonPct.value * rect.height), 0, rect.height);
    } else {
      // default to bottom
      controlsButtonTop.value = rect.height;
      controlsButtonPct.value = rect.height > 0 ? controlsButtonTop.value / rect.height : 0;
    }
  }
  await renderer.init();
};

onMounted(async () => {
  await initializeCanvas();
  await renderer.update(0, activeController.value);

  document.addEventListener("changeMode", handleChangeMode);
  document.addEventListener("toggleFullscreen", handleToggleFullscreen);
  document.addEventListener("fullscreenchange", initializeCanvas);

  const render = async (time: DOMHighResTimeStamp) => {
    const active = activeController.value;
    if (!active.paused) {
      await renderer.update(time, active);
      // Call the update method on whichever controller is active
      if (active.update) active.update();
      stats.value.update();
    }
    frameId = requestAnimationFrame(render);
  };

    // initialize controls button position after first render
    await nextTick();
    if (container.value && controlsButton.value) {
      const rect = container.value.getBoundingClientRect();
      controlsButtonTop.value = rect.height;
    }
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
  controller3d.value.unmount();
    // ensure any drag listeners removed
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
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

/* Fullscreen: make canvas/container fill viewport so pixel size matches fullscreen */
.canvas-container:fullscreen,
.canvas-container:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
}

.canvas-container:fullscreen .canvas,
.canvas-container:-webkit-full-screen .canvas {
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
  padding: 0.5rem calc(0.75rem + 44px) 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.45);
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
  transition:
    transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1),
    opacity 200ms ease;
}
.canvas-container:fullscreen .controls-hidden,
.canvas-container:-webkit-full-screen .controls-hidden,
.canvas-container:-moz-full-screen .controls-hidden {
  transform: translateY(110%);
  opacity: 0;
  pointer-events: none;
}

/* Compass overlay styles */
button.controls-button,
button.compass {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  width: 4em;
  height: 4em;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.5);
  cursor: pointer;
  touch-action: none;
  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
  &:focus {
    box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  }
}

button.controls-button {
  width: 5em;
  height: 5em;
  bottom: 0;
  right: 0;
  margin-right: -2.5em;
  margin-top: -2.5em;
  top: auto;
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

.top-menu {
  text-align: center;
}
</style>
