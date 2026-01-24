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

let onFsChange: (() => void) | null = null;

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
let _vertexBuffer: GPUBuffer | null = null;
let _indexBuffer: GPUBuffer | null = null;
let _uniformBuffer: GPUBuffer | null = null;
let _bindGroup: GPUBindGroup | null = null;
let _depthTexture: GPUTexture | null = null;
let _raf = 0;
let _indexCount = 0;

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

    // size canvas and create depth
    resizeCanvasForMode();

    // Generate white keys (7) and black keys (5) for one octave
    const whiteCount = 7;
    // More realistic proportions (relative scene units)
    const step = 0.26; // spacing between white key centers
    const hw = 0.115; // white half width (~0.23 total)
    const hl = 0.5; // white half length (~1.0 total)
    const hd = 0.02; // white half thickness (top surface at +0.02)
    const verts: number[] = [];
    const whiteCenters: number[] = [];
    for (let i = -3; i <= 3; i++) {
      const cx = i * step;
      whiteCenters.push(cx);
      const x1 = cx - hw, x2 = cx + hw;
      const y1 = -hl, y2 = hl;
      const z1 = -hd, z2 = hd;
      const cR = 1.0, cG = 1.0, cB = 1.0;
      // front
      verts.push(x1, y1, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x2, y1, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x2, y2, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x1, y2, z2, cR, cG, cB, 0, 0, 1);
      // back
      verts.push(x1, y1, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x1, y2, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x2, y2, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x2, y1, z1, cR, cG, cB, 0, 0, -1);
      // top
      verts.push(x1, y2, z1, cR, cG, cB, 0, 1, 0);
      verts.push(x1, y2, z2, cR, cG, cB, 0, 1, 0);
      verts.push(x2, y2, z2, cR, cG, cB, 0, 1, 0);
      verts.push(x2, y2, z1, cR, cG, cB, 0, 1, 0);
      // bottom
      verts.push(x1, y1, z1, cR, cG, cB, 0, -1, 0);
      verts.push(x2, y1, z1, cR, cG, cB, 0, -1, 0);
      verts.push(x2, y1, z2, cR, cG, cB, 0, -1, 0);
      verts.push(x1, y1, z2, cR, cG, cB, 0, -1, 0);
      // right
      verts.push(x2, y1, z1, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y2, z1, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y2, z2, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y1, z2, cR, cG, cB, 1, 0, 0);
      // left
      verts.push(x1, y1, z1, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y1, z2, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y2, z2, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y2, z1, cR, cG, cB, -1, 0, 0);
    }

    // Black keys: between whites (skip between E-F)
    const blackPairs = [[0,1],[1,2],[3,4],[4,5],[5,6]];
    const hwB = 0.07; // black half width (~0.14 total)
    const hlB = 0.32; // black half length (shorter)
    const blackThickness = 0.06; // total thickness of black key
    const blackRaiseGap = 0.01; // gap above white top surface
    for (const pair of blackPairs) {
      const cx = (whiteCenters[pair[0]] + whiteCenters[pair[1]]) / 2;
      const x1 = cx - hwB, x2 = cx + hwB;
      // align black key back edge with white key back (y = hl)
      const y2 = hl;
      const y1 = hl - 2 * hlB; // shorter length, anchored to back
      // position black key above white key surface: bottom = white top + gap
      const z1 = hd + blackRaiseGap; // bottom of black key
      const z2 = z1 + blackThickness; // top of black key
      const cR = 0.02, cG = 0.02, cB = 0.02;
      // front
      verts.push(x1, y1, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x2, y1, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x2, y2, z2, cR, cG, cB, 0, 0, 1);
      verts.push(x1, y2, z2, cR, cG, cB, 0, 0, 1);
      // back
      verts.push(x1, y1, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x1, y2, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x2, y2, z1, cR, cG, cB, 0, 0, -1);
      verts.push(x2, y1, z1, cR, cG, cB, 0, 0, -1);
      // top
      verts.push(x1, y2, z1, cR, cG, cB, 0, 1, 0);
      verts.push(x1, y2, z2, cR, cG, cB, 0, 1, 0);
      verts.push(x2, y2, z2, cR, cG, cB, 0, 1, 0);
      verts.push(x2, y2, z1, cR, cG, cB, 0, 1, 0);
      // bottom
      verts.push(x1, y1, z1, cR, cG, cB, 0, -1, 0);
      verts.push(x2, y1, z1, cR, cG, cB, 0, -1, 0);
      verts.push(x2, y1, z2, cR, cG, cB, 0, -1, 0);
      verts.push(x1, y1, z2, cR, cG, cB, 0, -1, 0);
      // right
      verts.push(x2, y1, z1, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y2, z1, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y2, z2, cR, cG, cB, 1, 0, 0);
      verts.push(x2, y1, z2, cR, cG, cB, 1, 0, 0);
      // left
      verts.push(x1, y1, z1, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y1, z2, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y2, z2, cR, cG, cB, -1, 0, 0);
      verts.push(x1, y2, z1, cR, cG, cB, -1, 0, 0);
    }

    const vertices = new Float32Array(verts);

    _vertexBuffer = _device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    _device.queue.writeBuffer(_vertexBuffer, 0, vertices);

    // build indices for each key (24 verts per key, 36 indices per key)
    const totalKeys = whiteCount + blackPairs.length;
    const idx: number[] = [];
    for (let k = 0; k < totalKeys; k++) {
      const base = k * 24;
      // front
      idx.push(base + 0, base + 1, base + 2, base + 0, base + 2, base + 3);
      // back
      idx.push(base + 4, base + 5, base + 6, base + 4, base + 6, base + 7);
      // top
      idx.push(base + 8, base + 9, base + 10, base + 8, base + 10, base + 11);
      // bottom
      idx.push(base + 12, base + 13, base + 14, base + 12, base + 14, base + 15);
      // right
      idx.push(base + 16, base + 17, base + 18, base + 16, base + 18, base + 19);
      // left
      idx.push(base + 20, base + 21, base + 22, base + 20, base + 22, base + 23);
    }
    const indices = new Uint16Array(idx);

    _indexBuffer = _device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    _device.queue.writeBuffer(_indexBuffer, 0, indices);
    _indexCount = indices.length;

    // Uniform buffer for MVP matrices and light direction
    _uniformBuffer = _device.createBuffer({
      size: 208, // 3x 4x4 matrices * 4 + 4 floats for light
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Perspective projection
    const fov = Math.PI / 4; // 45 degrees
    const aspect = 1; // square
    const near = 0.1;
    const far = 10;
    const f = 1 / Math.tan(fov / 2);
    const projectionMatrix = new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0,
    ]);

    const viewAngleX = -Math.PI / 3; 
    const cosVX = Math.cos(viewAngleX);
    const sinVX = Math.sin(viewAngleX);
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, cosVX, sinVX, 0,
      0, -sinVX, cosVX, 0,
      0, 0, -3, 1,  // translate z by 3
    ]);

    // Model matrix (rotation)
    const angleY = 0;
    const angleX = 0;
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const modelMatrix = new Float32Array([
      cosY, 0, sinY, 0,
      sinX * sinY, cosX, -sinX * cosY, 0,
      -cosX * sinY, sinX, cosX * cosY, 0,
      0, 0, 0, 1,
    ]);

    // Combine into uniform buffer: projection, view, model, lightDir
    const uniforms = new Float32Array(52); // 3 matrices + 4 floats
    uniforms.set(projectionMatrix, 0);
    uniforms.set(viewMatrix, 16);
    uniforms.set(modelMatrix, 32);
    // Light direction (normalized)
    const lightDir = [1, 1, 1];
    const len = Math.sqrt(lightDir[0]**2 + lightDir[1]**2 + lightDir[2]**2);
    uniforms[48] = lightDir[0]/len;
    uniforms[49] = lightDir[1]/len;
    uniforms[50] = lightDir[2]/len;
    uniforms[51] = 0; // padding
    _device.queue.writeBuffer(_uniformBuffer, 0, uniforms);

    const shaderCode = `
      struct Uniforms {
        projection: mat4x4<f32>,
        view: mat4x4<f32>,
        model: mat4x4<f32>,
        lightDir: vec3<f32>,
      };

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) color: vec3<f32>,
        @location(2) normal: vec3<f32>,
      };

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec3<f32>,
        @location(1) normal: vec3<f32>,
        @location(2) viewPos: vec3<f32>,
      };

      @vertex
      fn vs_main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        // position in clip space
        output.position = uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(input.position, 1.0);
        // pass color
        output.color = input.color;
        // transform normal into view space
        let n_view = (uniforms.view * uniforms.model * vec4<f32>(input.normal, 0.0)).xyz;
        output.normal = n_view;
        // position in view space
        output.viewPos = (uniforms.view * uniforms.model * vec4<f32>(input.position, 1.0)).xyz;
        return output;
      }

      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
        let N = normalize(input.normal);
        // light direction transformed to view space (w=0)
        let L = normalize((uniforms.view * vec4<f32>(uniforms.lightDir, 0.0)).xyz);
        // view direction in view space (camera at origin)
        let V = normalize(-input.viewPos);
        // diffuse term
        let diff = max(dot(N, L), 0.0);
        // specular (Blinn-Phong)
        let H = normalize(L + V);
        // lower exponent for broader highlights and increase intensity
        let specPower: f32 = 16.0;
        let spec = pow(max(dot(N, H), 0.0), specPower);
        let ambient = 0.20;
        // combine with stronger specular contribution
        let base = input.color;
        let specIntensity: f32 = 1.6;
        let color = base * (ambient + 0.75 * diff) + vec3<f32>(1.0, 1.0, 1.0) * spec * specIntensity;
        return vec4<f32>(color, 1.0);
      }
    `;

    const module = _device.createShaderModule({ code: shaderCode });
    _pipeline = _device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 9 * 4, // 9 floats * 4 bytes (pos + color + normal)
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                shaderLocation: 1,
                offset: 3 * 4, // after position
                format: "float32x3",
              },
              {
                shaderLocation: 2,
                offset: 6 * 4, // after color
                format: "float32x3",
              },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });

    _bindGroup = _device.createBindGroup({
      layout: _pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: _uniformBuffer },
        },
      ],
    });

    startRenderLoop();
  } catch (e) {
    // ignore WebGPU init failures for now
  }
}

function resizeCanvasForMode() {
  if (!canvas.value || !container.value || !_device) return;
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

  // Create depth texture
  _depthTexture = _device.createTexture({
    size: [canvas.value.width, canvas.value.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

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
    if (!_device || !_context || !_pipeline || !_vertexBuffer || !_indexBuffer || !_bindGroup || !_depthTexture) return;
    const commandEncoder = _device.createCommandEncoder();
    const textureView = _context.getCurrentTexture().createView();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          clearValue: { r: 0, g: 0.2, b: 0, a: 1 },
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: _depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    pass.setPipeline(_pipeline);
    pass.setBindGroup(0, _bindGroup);
    pass.setVertexBuffer(0, _vertexBuffer);
    pass.setIndexBuffer(_indexBuffer, "uint16");
    pass.drawIndexed(_indexCount);
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
  await initWebGPU();
  onFsChange = () => {
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
  if (onFsChange) {
    document.removeEventListener("fullscreenchange", onFsChange);
  }
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
