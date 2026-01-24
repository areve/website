<template>
  <article>
    <h1>Piano</h1>
    <p>WGSL-based canvas placeholder. Piano rendering will be added later.</p>

    <div class="top-menu">
      <button @click="handleToggleFullscreen" type="button">Fullscreen</button>
    </div>

    <div ref="container" class="canvas-container">
      <canvas ref="canvas" class="canvas" tabindex="0"></canvas>

      <!-- Right-hand circular controls button -->
      <button
        ref="controlsButton"
        class="controls-button"
        type="button"
        aria-label="Show controls"
        @click.stop="toggleControls"
        @pointerdown.stop.prevent="startDragControlsButton"
        :style="{ top: controlsButtonTop + 'px' }"
      ></button>

      <!-- Controls overlay: simple placeholder panel -->
      <div :class="['controls-overlay', { 'controls-hidden': !state.controls.visible }]">
        <div class="controls-content">
          <h2>Controls</h2>
          <p>Placeholder controls — add WGSL parameters later.</p>
          <label class="mode-select checkbox">
            <input type="checkbox" v-model="state.fullscreen" @change="handleToggleFullscreen" />
            Fullscreen
          </label>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { usePersistentState } from "./lib/persistenceService";

const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLElement | null>(null);
const controlsButton = ref<HTMLElement | null>(null);
const controlsButtonTop = ref<number>(0);

const state = ref({
  controls: { visible: false as boolean, buttonPosition: null as number | null },
  fullscreen: false as boolean,
});

usePersistentState("piano.state.v1", state);

function toggleControls(e?: Event) {
  if (_didDrag) {
    // cancel accidental click after drag
    if (e) e.stopPropagation?.();
    _didDrag = false;
    return;
  }
  if (e) e.stopPropagation?.();
  state.value.controls.visible = !state.value.controls.visible;
}

const handleToggleFullscreen = () => {
  const el = container.value || canvas.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.();
  }
};

// Dragging state for controls button (similar to ProceduralRenderer)
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
  try {
    controlsButton.value.setPointerCapture?.(e.pointerId);
  } catch {}
  e.preventDefault?.();
  window.addEventListener("pointermove", onPointerMove, {
    passive: false,
  } as any);
  window.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(e: PointerEvent) {
  if (!_dragging || !container.value || controlsButtonTop.value == null || !controlsButton.value) return;
  e.preventDefault?.();
  const rect = container.value.getBoundingClientRect();

  const delta = e.clientY - _dragStartY;
  const newTop = clamp(_dragStartTop + delta, 0, rect.height);
  controlsButtonTop.value = newTop;
  if (rect.height > 0) state.value.controls.buttonPosition = controlsButtonTop.value / rect.height;
  if (Math.abs(delta) > 4) _didDrag = true;
}

function onPointerUp(e: PointerEvent) {
  if (!container.value || !controlsButton.value) return;
  _dragging = false;
  try {
    controlsButton.value.releasePointerCapture?.(e.pointerId);
  } catch {}
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  const rect = container.value.getBoundingClientRect();
  const snapThreshold = 30;
  if (controlsButtonTop.value! <= snapThreshold) controlsButtonTop.value = 0;
  else if (controlsButtonTop.value! >= rect.height - snapThreshold) controlsButtonTop.value = rect.height;
  if (rect.height > 0) state.value.controls.buttonPosition = controlsButtonTop.value! / rect.height;
  setTimeout(() => {
    _didDrag = false;
  }, 0);
}

// --- WebGPU setup: minimal WGSL shader that paints green ---
let _adapter: GPUAdapter | null = null;
let _device: GPUDevice | null = null;
let _context: GPUCanvasContext | null = null;
let _pipeline: GPURenderPipeline | null = null;
let _raf = 0;

async function initWebGPU() {
  if (!canvas.value) return;
  if (!("gpu" in navigator)) return;
  try {
    _adapter = await (navigator as any).gpu.requestAdapter();
    if (!_adapter) return;
    _device = await _adapter.requestDevice();
    _context = (canvas.value.getContext("webgpu") as unknown) as GPUCanvasContext;
    const format = (navigator as any).gpu.getPreferredCanvasFormat ? (navigator as any).gpu.getPreferredCanvasFormat() : "bgra8unorm";
    _context.configure({ device: _device, format, alphaMode: "opaque" });

    const shaderCode = `
      @vertex
      fn vs_main(@builtin(vertex_index) vid : u32) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 3>(
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 3.0, -1.0),
          vec2<f32>(-1.0,  3.0)
        );
        let p = pos[vid];
        return vec4<f32>(p, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4<f32> {
        return vec4<f32>(0.0, 1.0, 0.0, 1.0);
      }
    `;

    const module = _device.createShaderModule({ code: shaderCode });
    _pipeline = _device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs_main",
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
    });

    startRenderLoop();
  } catch (e) {
    // ignore WebGPU init failures for now
  }
}

function resizeCanvasForMode() {
  if (!canvas.value || !container.value) return;
  const isFs = !!document.fullscreenElement;
  // sync fullscreen state
  state.value.fullscreen = isFs;

  if (!isFs) {
    // non-fullscreen: fixed 500x500
    const cssW = 500;
    const cssH = 500;
    canvas.value.style.width = cssW + "px";
    canvas.value.style.height = cssH + "px";
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = Math.round(cssW * dpr);
    canvas.value.height = Math.round(cssH * dpr);
  } else {
    // fullscreen: fill container
    const rect = (document.fullscreenElement as HTMLElement)?.getBoundingClientRect() ?? { width: window.innerWidth, height: window.innerHeight };
    canvas.value.style.width = rect.width + "px";
    canvas.value.style.height = rect.height + "px";
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = Math.round(rect.width * dpr);
    canvas.value.height = Math.round(rect.height * dpr);
  }
  // Update controls button position to track right-hand side similar to Procedural
  try {
    const rect = container.value.getBoundingClientRect();
    if (state.value.controls.buttonPosition != null && rect.height > 0) {
      controlsButtonTop.value = clamp(Math.round(state.value.controls.buttonPosition * rect.height), 0, rect.height);
    } else if (rect.height > 0) {
      controlsButtonTop.value = rect.height;
      state.value.controls.buttonPosition = rect.height > 0 ? controlsButtonTop.value / rect.height : 0;
    }
  } catch {}
}

function startRenderLoop() {
  const frame = () => {
    if (!_device || !_context || !_pipeline) return;
    const commandEncoder = _device.createCommandEncoder();
    const textureView = _context.getCurrentTexture().createView();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(_pipeline);
    pass.draw(3);
    pass.end();
    _device.queue.submit([commandEncoder.finish()]);
    _raf = requestAnimationFrame(frame);
  };
  _raf = requestAnimationFrame(frame);
}

onMounted(async () => {
  await nextTick();
  try {
    if (container.value) {
      const rect = container.value.getBoundingClientRect();
      controlsButtonTop.value = rect.height;
    }
  } catch {}
  // size canvas and init webgpu
  resizeCanvasForMode();
  await initWebGPU();
  const onFsChange = () => {
    // update fullscreen state and resize
    state.value.fullscreen = !!document.fullscreenElement;
    resizeCanvasForMode();
  };
  document.addEventListener("fullscreenchange", onFsChange);
  window.addEventListener("resize", resizeCanvasForMode);
});

onUnmounted(() => {
  // cleanup
  cancelAnimationFrame(_raf);
  try {
    if (_device) {
      // no explicit destroy for GPUPipeline; device may be released by GC
    }
  } catch {}
  window.removeEventListener("resize", resizeCanvasForMode);
  document.removeEventListener("fullscreenchange", onFsChange);
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

/* Controls panel: slide-in from the right */
.controls-overlay {
  position: absolute;
  top: 0;
  right: 0;
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
  border-width: 0 0 0 1px;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.8);
  transition:
    transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1),
    opacity 200ms ease;
}

.controls-hidden {
  transform: translateX(110%);
  opacity: 0;
  pointer-events: none;
}

button.controls-button {
  position: absolute;
  top: auto;
  right: 0;
  bottom: 0;
  width: 5em;
  height: 5em;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(127, 127, 127, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  margin-right: -2.5em;
  margin-top: -2.5em;
  box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.5);
  cursor: pointer;
  touch-action: none;
}

.controls-content h2 {
  margin: 0 0 0.5em 0;
}

.top-menu {
  text-align: center;
  margin-bottom: 0.5em;
}
</style>
