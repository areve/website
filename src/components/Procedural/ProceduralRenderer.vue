<template>
  <div class="top-menu">
    <button @click="handleToggleFullscreen" type="button">Fullscreen</button>
  </div>

  <div ref="container" class="canvas-container">
    <canvas ref="canvas" class="canvas" tabindex="0"></canvas>

    <!-- Tools button overlay: circular button on the left to show tools -->
    <button
      ref="toolsButton"
      class="tools-button"
      type="button"
      aria-label="Show tools"
      @click.stop="onToolsButtonClick"
      @keydown.enter.prevent="onToolsButtonClick"
      @pointerdown.stop.prevent="startDragToolsButton"
      :style="{ top: toolsButtonTop + 'px' }"
    ></button>

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
      class="controls-button"
      type="button"
      aria-label="Show controls"
      @click.stop="onControlsButtonClick"
      @keydown.enter.prevent="onControlsButtonClick"
      @pointerdown.stop.prevent="startDragControlsButton"
      :style="{ top: controlsButtonTop + 'px' }"
    ></button>

    <div :class="['controls-overlay', { 'controls-hidden': !controlsVisible }]">
      <div>
        <label class="mode-select">
          Mode:
          <select @change="initializeCanvas" v-model="shaderMode">
            <option
              v-for="mode in availableModes"
              :key="mode"
              :value="mode"
            >
              {{ modeLabels[mode] || mode }}
            </option>
          </select>
        </label>
        <label class="mode-select">
          Zoom Centre:
          <select v-model="zoomOrigin">
            <option value="pointer">Mouse</option>
            <option value="center">Center</option>
          </select>
        </label>
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
        <label class="mode-select checkbox">
          <input
            type="checkbox"
            v-model="isFullscreen"
            @change="handleToggleFullscreen"
          />
          Fullscreen
        </label>
        <label class="mode-select checkbox">
          <input type="checkbox" v-model="compassVisible" />
          Show Compass
        </label>
        <label class="mode-select checkbox">
          <input type="checkbox" v-model="statusVisible" />
          Show Status Panel
        </label>
      </div>
    </div>
    <div :class="['tools-overlay', { 'tools-hidden': !toolsVisible }]">
      <!-- tools panel (empty for now) -->
    </div>
    <!-- Bottom status panel (full width) -->
    <div :class="['status-panel', { 'status-hidden': !statusVisible }]">
      <div class="status-content">
        {{ stats.fps.toPrecision(3) }}fps {{ statsX }}x {{ statsY }}y
        {{ statsZ }}z {{ statsZoom }}zoom {{ statsRot }}rot
        <span v-if="statsPaused">paused</span>
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
let _resizeObserver: ResizeObserver | null = null;

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
const toolsVisible = ref(false);
const compassVisible = ref(false);

// Controls button vertical position (pixels from top of container)
const controlsButton = ref<HTMLElement | null>(null);
const controlsButtonTop = ref<number>(0);
// Stored as fraction [0..1] of container height so position scales on resize/fullscreen
const controlsButtonPct = ref<number | null>(null);
// Tools button (left)
const toolsButton = ref<HTMLElement | null>(null);
const toolsButtonTop = ref<number>(0);
const toolsButtonPct = ref<number | null>(null);
// Fullscreen checkbox state (kept in sync in initializeCanvas)
const isFullscreen = ref(false);
// Status panel visibility
const statusVisible = ref(false);
let _dragging = false;
let _dragStartY = 0;
let _dragStartTop = 0;
let _didDrag = false;
// Tools drag state
let _draggingTools = false;
let _dragStartYTools = 0;
let _dragStartTopTools = 0;
let _didDragTools = false;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function startDragControlsButton(e: PointerEvent) {
  if (!controlsButton.value || !container.value) return;
  _dragging = true;
  _dragStartY = e.clientY;
  _dragStartTop = controlsButtonTop.value ?? 0;
  try {
    controlsButton.value.setPointerCapture?.(e.pointerId);
  } catch {}
  e.preventDefault?.();
  window.addEventListener("pointermove", onPointerMove, {
    passive: false,
  } as any);
  window.addEventListener("pointerup", onPointerUp);
}

function startDragToolsButton(e: PointerEvent) {
  if (!toolsButton.value || !container.value) return;
  _draggingTools = true;
  _dragStartYTools = e.clientY;
  _dragStartTopTools = toolsButtonTop.value ?? 0;
  try {
    toolsButton.value.setPointerCapture?.(e.pointerId);
  } catch {}
  e.preventDefault?.();
  window.addEventListener("pointermove", onPointerMoveTools, {
    passive: false,
  } as any);
  window.addEventListener("pointerup", onPointerUpTools);
}

function onPointerMove(e: PointerEvent) {
  if (
    !_dragging ||
    !container.value ||
    controlsButtonTop.value == null ||
    !controlsButton.value
  )
    return;
  e.preventDefault?.();
  const rect = container.value.getBoundingClientRect();

  const delta = e.clientY - _dragStartY;
  const newTop = clamp(_dragStartTop + delta, 0, rect.height);
  controlsButtonTop.value = newTop;
  // record relative position so it can be restored on resize/fullscreen
  if (rect.height > 0)
    controlsButtonPct.value = controlsButtonTop.value / rect.height;
  if (Math.abs(delta) > 4) _didDrag = true;
}

function onPointerMoveTools(e: PointerEvent) {
  if (
    !_draggingTools ||
    !container.value ||
    toolsButtonTop.value == null ||
    !toolsButton.value
  )
    return;
  e.preventDefault?.();
  const rect = container.value.getBoundingClientRect();

  const delta = e.clientY - _dragStartYTools;
  const newTop = clamp(_dragStartTopTools + delta, 0, rect.height);
  toolsButtonTop.value = newTop;
  // record relative position so it can be restored on resize/fullscreen
  if (rect.height > 0) toolsButtonPct.value = toolsButtonTop.value / rect.height;
  if (Math.abs(delta) > 4) _didDragTools = true;
}

function onPointerUp(e: PointerEvent) {
  if (!container.value || !controlsButton.value) return;
  _dragging = false;
  try {
    controlsButton.value.releasePointerCapture?.(e.pointerId);
  } catch {}
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  // snap to corners if close
  const rect = container.value.getBoundingClientRect();
  const snapThreshold = 30;
  if (controlsButtonTop.value! <= snapThreshold) controlsButtonTop.value = 0;
  else if (controlsButtonTop.value! >= rect.height - snapThreshold)
    controlsButtonTop.value = rect.height;
  // update stored percentage after snapping
  if (rect.height > 0)
    controlsButtonPct.value = controlsButtonTop.value! / rect.height;
  // keep _didDrag true long enough to cancel the following click event, then clear
  setTimeout(() => {
    _didDrag = false;
  }, 0);
}

function onPointerUpTools(e: PointerEvent) {
  if (!container.value || !toolsButton.value) return;
  _draggingTools = false;
  try {
    toolsButton.value.releasePointerCapture?.(e.pointerId);
  } catch {}
  window.removeEventListener("pointermove", onPointerMoveTools);
  window.removeEventListener("pointerup", onPointerUpTools);
  // snap to corners if close
  const rect = container.value.getBoundingClientRect();
  const snapThreshold = 30;
  if (toolsButtonTop.value! <= snapThreshold) toolsButtonTop.value = 0;
  else if (toolsButtonTop.value! >= rect.height - snapThreshold) toolsButtonTop.value = rect.height;
  // update stored percentage after snapping
  if (rect.height > 0) toolsButtonPct.value = toolsButtonTop.value! / rect.height;
  // keep _didDragTools true long enough to cancel the following click event, then clear
  setTimeout(() => {
    _didDragTools = false;
  }, 0);
}

function onControlsButtonClick(e: Event) {
  if (_didDrag) {
    e.stopPropagation?.();
    return;
  }
  toggleControls();
}

function onToolsButtonClick(e: Event) {
  if (_didDragTools) {
    e.stopPropagation?.();
    return;
  }
  toggleTools();
}

function toggleControls() {
  controlsVisible.value = !controlsVisible.value;
}

function toggleTools() {
  toolsVisible.value = !toolsVisible.value;
}

const width = 500;
const height = 500;
const seed = 12345;
const modeLabels = {
  simplex: "OpenSimplex",
  opensimplex2: "OpenSimplex2",
  opensimplex2s: "OpenSimplex2S",
  perlin: "Perlin",
  value: "Value",
  fractal: "Fractal",
  julia: "Julia",
  lorenz: "Lorenz",
  sierpinski: "Sierpinski",
  trigonometry: "Trigonometry",
  valuecubic: "Value Cubic",
  newton: "Newton Raphson",
  ripple: "Ripple",
  mandelbrot: "Mandelbrot",
  worley: "Worley",
  mountains: "Mountains",
  opensimplex3d: "OpenSimplex 3D",
  flowfield: "Flow Field",
  mountains3d: "Mountains 3D",
} as const;

type ShaderMode = keyof typeof modeLabels;

// derive the array of modes from the labels object to keep a single source of truth
const availableModes = Object.keys(modeLabels) as ShaderMode[];

const shaderMode = ref<ShaderMode>("flowfield");

let frameId: number = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const handleChangeMode = async () => {
  const idx = availableModes.indexOf(shaderMode.value);
  const next = availableModes[(idx + 1) % availableModes.length];
  shaderMode.value = next;
  await initializeCanvas();
};

const handleChangeModeReverse = async () => {
  const idx = availableModes.indexOf(shaderMode.value);
  const len = availableModes.length;
  const prev = availableModes[(idx - 1 + len) % len];
  shaderMode.value = prev;
  await initializeCanvas();
};

const handleToggleFullscreen = () => {
  const el = container.value || canvas.value;

  if (!document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {});
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

  // sync fullscreen checkbox state
  isFullscreen.value = isFs;

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
  // sync fullscreen checkbox state
  isFullscreen.value = isFs;
  // Restore controls button position proportionally to the new container height
  if (container.value && controlsButton.value) {
    const rect = container.value.getBoundingClientRect();
    if (controlsButtonPct.value != null && rect.height > 0) {
      controlsButtonTop.value = clamp(
        Math.round(controlsButtonPct.value * rect.height),
        0,
        rect.height,
      );
    } else {
      // default to bottom
      controlsButtonTop.value = rect.height;
      controlsButtonPct.value =
        rect.height > 0 ? controlsButtonTop.value / rect.height : 0;
    }
  }
  // Restore tools button position proportionally to the new container height
  if (container.value && toolsButton.value) {
    const rect = container.value.getBoundingClientRect();
    if (toolsButtonPct.value != null && rect.height > 0) {
      toolsButtonTop.value = clamp(
        Math.round(toolsButtonPct.value * rect.height),
        0,
        rect.height,
      );
    } else {
      // default to bottom
      toolsButtonTop.value = rect.height;
      toolsButtonPct.value = rect.height > 0 ? toolsButtonTop.value / rect.height : 0;
    }
  }
  await renderer.init();
  // Ensure the canvas has keyboard focus so controller keyboard shortcuts work
  // after fullscreen/resizes (some browsers move focus away on fullscreenchange).
  await nextTick();
  try {
    canvas.value?.focus?.();
  } catch (_) {
    // ignore focus errors
  }
};

onMounted(async () => {
  await initializeCanvas();
  await renderer.update(0, activeController.value);

  document.addEventListener("changeMode", handleChangeMode);
  document.addEventListener("changeModeReverse", handleChangeModeReverse);
  document.addEventListener("toggleFullscreen", handleToggleFullscreen);
  document.addEventListener("fullscreenchange", initializeCanvas);
  // Recompute canvas size when the window or container resizes (covers devtools toggle)
  window.addEventListener("resize", initializeCanvas);
  if (typeof ResizeObserver !== "undefined") {
    _resizeObserver = new ResizeObserver(() => {
      initializeCanvas();
    });
    if (container.value) _resizeObserver.observe(container.value);
  }

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
  if (container.value && toolsButton.value) {
    const rect = container.value.getBoundingClientRect();
    toolsButtonTop.value = rect.height;
  }
  frameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  document.removeEventListener("changeMode", handleChangeMode);
  document.removeEventListener("changeModeReverse", handleChangeModeReverse);
  document.removeEventListener("toggleFullscreen", handleToggleFullscreen);
  document.removeEventListener("fullscreenchange", initializeCanvas);
  window.removeEventListener("resize", initializeCanvas);
  if (_resizeObserver) {
    _resizeObserver.disconnect();
    _resizeObserver = null;
  }
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
  window.removeEventListener("pointermove", onPointerMoveTools);
  window.removeEventListener("pointerup", onPointerUpTools);
});
</script>

<style scoped>
.canvas {
  touch-action: none;
}

.canvas-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
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

/* Controls panel: slide-in from the right, full height, ~45% width capped at 300px */
.controls-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 220px;
  /* width: min(45%, 300px); */
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1em;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  z-index: 35;
  backdrop-filter: blur(6px);
  pointer-events: auto;
  transform: translateX(0);
  opacity: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.8);
  transition:
    transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1),
    opacity 200ms ease;
}

/* Tools panel: slide-in from the left, full height, ~45% width capped at 300px */
.tools-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1em;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  z-index: 35;
  backdrop-filter: blur(6px);
  pointer-events: auto;
  transform: translateX(0);
  opacity: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.8);
  transition:
    transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1),
    opacity 200ms ease;
}
.tools-hidden {
  transform: translateX(-110%);
  opacity: 0;
  pointer-events: none;
}

.controls-overlay .stats {
  font-family: monospace;
  font-size: 0.9rem;
}

/* Bottom status panel (full-width strip) */
.status-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2.25rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  z-index: 20; /* below controls panel (35) and controls button (50) */
  transform: translateY(0);
  transition:
    transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1),
    opacity 180ms ease;
}
.status-panel .status-content {
  font-family: monospace;
  font-size: 0.9rem;
}
.status-hidden {
  transform: translateY(110%);
  opacity: 0;
  pointer-events: none;
}

/* Hidden state: slide completely off the right */
.controls-hidden {
  transform: translateX(110%);
  opacity: 0;
  pointer-events: none;
}

/* Fullscreen rules — behave the same (slide in/out horizontally) */
.canvas-container:fullscreen .controls-overlay,
.canvas-container:-webkit-full-screen .controls-overlay,
.canvas-container:-moz-full-screen .controls-overlay {
  transform: translateX(0);
}
.canvas-container:fullscreen .controls-hidden,
.canvas-container:-webkit-full-screen .controls-hidden,
.canvas-container:-moz-full-screen .controls-hidden {
  transform: translateX(110%);
}

.canvas-container:fullscreen .tools-overlay,
.canvas-container:-webkit-full-screen .tools-overlay,
.canvas-container:-moz-full-screen .tools-overlay {
  transform: translateX(0);
}
.canvas-container:fullscreen .tools-hidden,
.canvas-container:-webkit-full-screen .tools-hidden,
.canvas-container:-moz-full-screen .tools-hidden {
  transform: translateX(-110%);
}

/* Compass overlay styles */
button.controls-button,
button.tools-button,
button.compass {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  width: 4em;
  height: 4em;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(127, 127, 127, 0.4);
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
  z-index: 50;
  width: 5em;
  height: 5em;
  bottom: 0;
  right: 0;
  margin-right: -2.5em;
  margin-top: -2.5em;
  top: auto;
}

button.tools-button {
  z-index: 50;
  width: 5em;
  height: 5em;
  bottom: 0;
  left: 0;
  margin-left: -2.5em;
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
  margin-bottom: 0.5em;
}
</style>
