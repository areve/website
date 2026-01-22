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
      @click.stop="toggleTools"
      @keydown.enter.prevent="toggleTools"
      @pointerdown.stop.prevent="startDragToolsButton"
      :style="{ top: toolsButtonTop + 'px' }"
    ></button>

    <!-- Compass overlay: circular 50px compass with rotating SVG needle -->
    <button
      v-show="state.controls.showCompass"
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
      @click.stop="toggleControls"
      @keydown.enter.prevent="toggleControls"
      @pointerdown.stop.prevent="startDragControlsButton"
      :style="{ top: controlsButtonTop + 'px' }"
    ></button>

    <div
      :class="[
        'controls-overlay',
        { 'controls-hidden': !state.controls.visible },
      ]"
    >
      <div>
        <label class="mode-select">
          Mode:
          <select @change="initializeCanvas" v-model="state.controls.mode">
            <option v-for="mode in availableModes" :key="mode" :value="mode">
              {{ modeLabels[mode] || mode }}
            </option>
          </select>
        </label>
        <label class="mode-select">
          Zoom Centre:
          <select v-model="state.controls.zoomOrigin">
            <option value="pointer">Mouse</option>
            <option value="center">Center</option>
          </select>
        </label>
        <label
          v-if="state.controls.mode === 'mountains3d' || state.controls.mode === 'opensimplex3d'"
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
            v-model="state.fullscreen"
            @change="handleToggleFullscreen"
          />
          Fullscreen
        </label>
        <label class="mode-select checkbox">
          <input type="checkbox" v-model="state.controls.showCompass" />
          Show Compass
        </label>
        <label class="mode-select checkbox">
          <input type="checkbox" v-model="state.status.visible" />
          Show Status Panel
        </label>
      </div>
    </div>
    <div :class="['tools-overlay', { 'tools-hidden': !state.tools.visible }]">
      <!-- tools panel (empty for now) -->
    </div>
    <!-- Bottom status panel (full width) -->
    <div :class="['status-panel', { 'status-hidden': !state.status.visible }]">
      <div class="status-content">
        {{ stats.fps.toPrecision(3) }}fps {{ statsX }}x {{ statsY }}y
        {{ statsZ }}z {{ statsZoom }}zoom {{ statsRot }}rot
        <span v-if="statsPaused">paused</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from "vue";
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
const controller = makeController({
  basicKeys: {
    pause: { startPaused: false },
  },
  acceleratorKeys: {
    zoom: {
      origin: () => state.value?.controls?.zoomOrigin ?? "center",
    },
  },
});

// Animation pause state (separate from controller.paused which used to be toggled)
const animationPaused = ref(controller.value.paused);

function handleTogglePause() {
  animationPaused.value = !animationPaused.value;
}

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
  const currentMode = state.value.controls.mode as ShaderMode;
  const use3d =
    (currentMode === "opensimplex3d" && controllerMode.value === "3d") ||
    (currentMode === "mountains3d" && controllerMode.value === "3d");
  const rad = use3d
    ? (controller3d.value.yaw ?? 0)
    : (controller.value.rotation ?? 0);
  const deg = (-rad * 180) / Math.PI;
  return `rotate(${deg}deg)`;
});

// Which controller is currently active (object, not ref)
const activeController = computed(() => {
  const currentMode = state.value.controls.mode as ShaderMode;
  if (currentMode === "opensimplex3d") {
    return controllerMode.value === "3d"
      ? controller3d.value
      : controller.value;
  }
  if (currentMode === "mountains3d" && controllerMode.value === "3d")
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
let _stopStateWatcher: (() => void) | null = null;

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
  const is3d = state.value.controls.mode === "opensimplex3d";
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
// LocalStorage persistence for UI state
const STORAGE_KEY = "proceduralRenderer.state.v1";

function getDefaultState() {
  return {
    tools: { visible: false as boolean, buttonPosition: null as number | null },
    controls: {
      visible: false as boolean,
      buttonPosition: null as number | null,
      mode: "flowfield" as ShaderMode,
      zoomOrigin: "center" as "pointer" | "center",
      showCompass: false as boolean,
    },
    status: { visible: false as boolean },
    fullscreen: false as boolean,
  };
}

function mergeDeep(dest: any, src: any) {
  if (!src || typeof src !== "object") return dest;
  for (const key of Object.keys(src)) {
    const val = src[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (!dest[key] || typeof dest[key] !== "object") dest[key] = {};
      mergeDeep(dest[key], val);
    } else {
      dest[key] = val;
    }
  }
  return dest;
}

function loadState() {
  const defaults = getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    return mergeDeep(defaults, parsed);
  } catch (e) {
    return defaults;
  }
}

function saveState(obj: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (_e) {
    // ignore localStorage errors
  }
}

// Global UI state (single source of truth)
// Initialize by merging saved state with defaults so new properties get defaults
const state = ref(loadState());

// Removed convenience computed wrappers; use `state` directly.

// Controls button vertical position (pixels from top of container)
const controlsButton = ref<HTMLElement | null>(null);
const controlsButtonTop = ref<number>(0);
// Tools button (left)
const toolsButton = ref<HTMLElement | null>(null);
const toolsButtonTop = ref<number>(0);
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
    state.value.controls.buttonPosition = controlsButtonTop.value / rect.height;
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
  if (rect.height > 0)
    state.value.tools.buttonPosition = toolsButtonTop.value / rect.height;
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
    state.value.controls.buttonPosition =
      controlsButtonTop.value! / rect.height;
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
  else if (toolsButtonTop.value! >= rect.height - snapThreshold)
    toolsButtonTop.value = rect.height;
  // update stored percentage after snapping
  if (rect.height > 0)
    state.value.tools.buttonPosition = toolsButtonTop.value! / rect.height;
  // keep _didDragTools true long enough to cancel the following click event, then clear
  setTimeout(() => {
    _didDragTools = false;
  }, 0);
}

function toggleControls(e: Event) {
  if (_didDrag) {
    e.stopPropagation?.();
    return;
  }
  state.value.controls.visible = !state.value.controls.visible;
}

function toggleTools(e: Event) {
  if (_didDragTools) {
    e.stopPropagation?.();
    return;
  }
  state.value.tools.visible = !state.value.tools.visible;
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

// shaderMode persisted in `state.controls.mode`; remove local ref

let frameId: number = 0;
let lastRenderTime: DOMHighResTimeStamp = 0;
let pauseStartReal: DOMHighResTimeStamp | null = null;
let totalPausedTime = 0;
let renderer: Awaited<ReturnType<typeof setupOpenSimplexRenderer>>;

const handleChangeMode = async () => {
  const idx = availableModes.indexOf(state.value.controls.mode);
  const next = availableModes[(idx + 1) % availableModes.length];
  state.value.controls.mode = next;
  await initializeCanvas();
};

const handleChangeModeReverse = async () => {
  const idx = availableModes.indexOf(state.value.controls.mode);
  const len = availableModes.length;
  const prev = availableModes[(idx - 1 + len) % len];
  state.value.controls.mode = prev;
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
  state.value.fullscreen = isFs;

  // Ensure the canvas CSS size matches measured values so drawing matches onscreen aspect
  if (canvas.value) {
    canvas.value.style.width = `${newWidth}px`;
    canvas.value.style.height = `${newHeight}px`;
  }

  // Unmount both controllers before switching modes
  controller.value.unmount();
  controller3d.value.unmount();

  if (state.value.controls.mode === "mandelbrot") {
    renderer = await setupMandelbrotRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (state.value.controls.mode === "ripple") {
    renderer = await setupRippleRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (state.value.controls.mode === "worley") {
    renderer = await setupWorleyRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (state.value.controls.mode === "mountains") {
    renderer = await setupMountainsRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
  } else if (state.value.controls.mode === "opensimplex3d") {
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
  } else if (state.value.controls.mode === "opensimplex2") {
    renderer = await setupOpenSimplex2Renderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "perlin") {
    // Perlin renderer (copied from OpenSimplex variant) — useful for debugging.
    renderer = await setupPerlinRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "julia") {
    renderer = await setupJuliaRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "lorenz") {
    renderer = await setupLorenzRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "fractal") {
    renderer = await setupFractalRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "trigonometry") {
    renderer = await setupTrigonometryRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "sierpinski") {
    renderer = await setupSierpinskiRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "valuecubic") {
    renderer = await setupValueCubicRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "value") {
    renderer = await setupValueRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "flowfield") {
    renderer = await setupFlowfieldRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "newton") {
    renderer = await setupNewtonRenderer(canvas.value, {
      width: newWidth,
      height: newHeight,
      seed,
    });
    if (canvas.value) controller.value.mount(canvas.value);
  } else if (state.value.controls.mode === "mountains3d") {
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
    state.value.controls.mode !== "opensimplex3d" &&
    state.value.controls.mode !== "mountains3d"
  ) {
    if (canvas.value) {
      controller.value.mount(canvas.value);
    }
  }
  // sync fullscreen checkbox state
  state.value.fullscreen = isFs;
  // Restore controls button position proportionally to the new container height
  if (container.value && controlsButton.value) {
    const rect = container.value.getBoundingClientRect();
    if (state.value.controls.buttonPosition != null && rect.height > 0) {
      controlsButtonTop.value = clamp(
        Math.round(state.value.controls.buttonPosition * rect.height),
        0,
        rect.height,
      );
    } else {
      // default to bottom
      controlsButtonTop.value = rect.height;
      state.value.controls.buttonPosition =
        rect.height > 0 ? controlsButtonTop.value / rect.height : 0;
    }
  }
  // Restore tools button position proportionally to the new container height
  if (container.value && toolsButton.value) {
    const rect = container.value.getBoundingClientRect();
    if (state.value.tools.buttonPosition != null && rect.height > 0) {
      toolsButtonTop.value = clamp(
        Math.round(state.value.tools.buttonPosition * rect.height),
        0,
        rect.height,
      );
    } else {
      // default to bottom
      toolsButtonTop.value = rect.height;
      state.value.tools.buttonPosition =
        rect.height > 0 ? toolsButtonTop.value / rect.height : 0;
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
  // initial renderer update with time=0 (use timing offset)
  lastRenderTime = 0;
  totalPausedTime = 0;
  pauseStartReal = null;
  await renderer.update(0, activeController.value);

  document.addEventListener("changeMode", handleChangeMode);
  document.addEventListener("changeModeReverse", handleChangeModeReverse);
  document.addEventListener("toggleFullscreen", handleToggleFullscreen);
  document.addEventListener("togglePause", handleTogglePause);
  document.addEventListener("fullscreenchange", initializeCanvas);
  // Recompute canvas size when the window or container resizes (covers devtools toggle)
  window.addEventListener("resize", initializeCanvas);
  if (typeof ResizeObserver !== "undefined") {
    _resizeObserver = new ResizeObserver(() => {
      initializeCanvas();
    });
    if (container.value) _resizeObserver.observe(container.value);
  }

  // Start a deep watcher to persist UI state to localStorage whenever it changes
  _stopStateWatcher = watch(
    state,
    (val) => {
      try {
        saveState(val);
      } catch (_) {}
    },
    { deep: true },
  );

  const render = async (time: DOMHighResTimeStamp) => {
    const active = activeController.value;
    let effectiveTime: DOMHighResTimeStamp;
    if (animationPaused.value) {
      // on pause start, capture real time; freeze effectiveTime to the
      // animation time at the moment of pause (pauseStartReal - totalPausedTime)
      if (pauseStartReal == null) pauseStartReal = time;
      effectiveTime = pauseStartReal - totalPausedTime;
    } else {
      // if we are resuming from a pause, add paused duration to the accumulator
      if (pauseStartReal != null) {
        totalPausedTime += time - pauseStartReal;
        pauseStartReal = null;
      }
      effectiveTime = time - totalPausedTime;
    }

    await renderer.update(effectiveTime, active);
    // Always update controller input state so WASD/drag/pinch remain responsive
    if (active.update) active.update();
    stats.value.update();
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
  document.removeEventListener("togglePause", handleTogglePause);
  document.removeEventListener("fullscreenchange", initializeCanvas);
  window.removeEventListener("resize", initializeCanvas);
  if (_resizeObserver) {
    _resizeObserver.disconnect();
    _resizeObserver = null;
  }
  if (_stopStateWatcher) {
    try {
      _stopStateWatcher();
    } catch (_) {}
    _stopStateWatcher = null;
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
  border: solid rgba(255, 255, 255, 0.2);
  border-width: 0 0 0 1px;
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
  border: solid rgba(255, 255, 255, 0.2);
  border-width: 0 1px 0 0;

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
