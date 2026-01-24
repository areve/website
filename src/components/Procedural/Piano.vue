<template>
  <article>
    <h1>Piano</h1>
    <p>An attempt to make a working piano keyboard.</p>

    <div class="top-menu">
      <button @click="handleToggleFullscreen" type="button">Fullscreen</button>
    </div>

    <div ref="container" class="canvas-container">
        <canvas ref="canvas" class="canvas" tabindex="0"></canvas>
        <canvas ref="overlay" class="overlay-canvas" aria-hidden="true"></canvas>

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
          <label class="mode-select checkbox">
            <input type="checkbox" v-model="state.controls.showHitRegions" />
            Show hit regions
          </label>
          <label class="mode-select">
            <span>Octaves</span>
            <input type="number" v-model.number="state.controls.octaves" min="1" max="6" style="width:4em;margin-left:8px;" />
          </label>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { usePersistentState } from "./lib/persistenceService";

const canvas = ref<HTMLCanvasElement | null>(null);
const overlay = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLElement | null>(null);
const controlsButton = ref<HTMLElement | null>(null);
const controlsButtonTop = ref<number>(0);

let onFsChange: (() => void) | null = null;

const state = ref({
  controls: { visible: false as boolean, buttonPosition: null as number | null, showHitRegions: false as boolean, octaves: 2 as number },
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

let _onContextMenu: ((e: Event) => void) | null = null;

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
let _vertices: Float32Array | null = null;
let _originalVertices: Float32Array | null = null;
let _projectionMatrix: Float32Array | null = null;
let _viewMatrix: Float32Array | null = null;
let _modelMatrix: Float32Array | null = null;
// Audio
let _audioCtx: AudioContext | null = null;
const _activeVoices = new Map<number, any>();

function ensureAudio() {
  if (_audioCtx) return _audioCtx;
  _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _audioCtx;
}

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function rebuildKeyboard(octaves: number) {
  if (!_device) return;
  const whiteCount = (octaves || 2) * 7;
  // More realistic proportions (relative scene units)
  const step = 0.26; // spacing between white key centers
  const hw = 0.115; // white half width (~0.23 total)
  const hl = 0.5; // white half length (~1.0 total)
  const hd = 0.02; // white half thickness (top surface at +0.02)
  const verts: number[] = [];
  const whiteCenters: number[] = [];
  // center white keys left-to-right
  const half = Math.floor(whiteCount / 2);
  const start = -half;
  for (let i = start; i < start + whiteCount; i++) {
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

  // Black keys: generate pairs between whites, skipping the E-F and B-C gaps
  const blackPairs: number[][] = [];
  for (let j = 0; j < whiteCount - 1; j++) {
    const mod = ((j % 7) + 7) % 7; // 0=C,1=D,2=E,3=F,4=G,5=A,6=B
    if (mod === 2 || mod === 6) continue;
    blackPairs.push([j, j + 1]);
  }
  const hwB = 0.07; // black half width (~0.14 total)
  const hlB = 0.32; // black half length (shorter)
  const blackThickness = 0.06; // total thickness of black key
  const blackRaiseGap = 0.01; // gap above white top surface
  for (const pair of blackPairs) {
    const cx = (whiteCenters[pair[0]] + whiteCenters[pair[1]]) / 2;
    const x1 = cx - hwB, x2 = cx + hwB;
    const y2 = hl;
    const y1 = hl - 2 * hlB;
    const z1 = hd + blackRaiseGap;
    const z2 = z1 + blackThickness;
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

  // create/update vertex buffer
  _vertexBuffer = _device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  _device.queue.writeBuffer(_vertexBuffer, 0, vertices);
  _originalVertices = new Float32Array(vertices);
  _vertices = new Float32Array(vertices);

  // build indices
  const totalKeys = whiteCount + blackPairs.length;
  const idx: number[] = [];
  for (let k = 0; k < totalKeys; k++) {
    const base = k * 24;
    idx.push(base + 0, base + 1, base + 2, base + 0, base + 2, base + 3);
    idx.push(base + 4, base + 5, base + 6, base + 4, base + 6, base + 7);
    idx.push(base + 8, base + 9, base + 10, base + 8, base + 10, base + 11);
    idx.push(base + 12, base + 13, base + 14, base + 12, base + 14, base + 15);
    idx.push(base + 16, base + 17, base + 18, base + 16, base + 18, base + 19);
    idx.push(base + 20, base + 21, base + 22, base + 20, base + 22, base + 23);
  }
  const indices = new Uint16Array(idx);

  _indexBuffer = _device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  _device.queue.writeBuffer(_indexBuffer, 0, indices);
  _indexCount = indices.length;

  // build keysInfo and center middle C
  _keysInfo = [];
  const whiteOffsets = [0, 2, 4, 5, 7, 9, 11];
  const centerIndex = Math.floor(whiteCount / 2);
  const centerOctave = Math.floor(centerIndex / 7);
  const centerOffset = whiteOffsets[centerIndex % 7];
  for (let k = 0; k < whiteCount; k++) {
    const base = k * 24;
    const pivotY = hl;
    const pivotZ = -hd - 0.02;
    const octave = Math.floor(k / 7);
    const semitone = whiteOffsets[k % 7] + (octave - centerOctave) * 12 - centerOffset;
    const midi = 60 + semitone;
    _keysInfo.push({ baseVertex: base, type: "white", cx: whiteCenters[k], zCenter: 0, pressed: false, pivotY, pivotZ, midi } as any);
  }
  const blackOffsetsMap: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
  for (let j = 0; j < blackPairs.length; j++) {
    const pair = blackPairs[j];
    const cx = (whiteCenters[pair[0]] + whiteCenters[pair[1]]) / 2;
    const base = (whiteCount + j) * 24;
    const zCenter = hd + blackRaiseGap + blackThickness / 2;
    const pivotY = hl;
    const pivotZ = hd + blackRaiseGap - 0.02;
    const left = pair[0];
    const octave = Math.floor(left / 7);
    const mod = ((left % 7) + 7) % 7;
    const offset = blackOffsetsMap[mod] ?? 1;
    const semitone = offset + (octave - centerOctave) * 12 - centerOffset;
    const midi = 60 + semitone;
    _keysInfo.push({ baseVertex: base, type: "black", cx, zCenter, pressed: false, pivotY, pivotZ, midi } as any);
  }

  // set halfWidth
  for (let i = 0; i < _keysInfo.length; i++) {
    const info: any = _keysInfo[i];
    info.halfWidth = info.type === "white" ? hw : hwB;
  }

  // recompute screen boxes if matrices exist
  try { if (_projectionMatrix && _viewMatrix && _modelMatrix && canvas.value) updateKeyScreenBoxes(); } catch {}
}

function updateUniforms() {
  if (!_device || !_uniformBuffer || !_projectionMatrix || !_viewMatrix || !_modelMatrix) return;
  const uniforms = new Float32Array(52);
  uniforms.set(_projectionMatrix, 0);
  uniforms.set(_viewMatrix, 16);
  uniforms.set(_modelMatrix, 32);
  // Light direction (normalized)
  const lightDir = [1, 1, 1];
  const len = Math.sqrt(lightDir[0] ** 2 + lightDir[1] ** 2 + lightDir[2] ** 2);
  uniforms[48] = lightDir[0] / len;
  uniforms[49] = lightDir[1] / len;
  uniforms[50] = lightDir[2] / len;
  uniforms[51] = 0;
  try { _device.queue.writeBuffer(_uniformBuffer!, 0, uniforms); } catch {}
}

function updateProjection() {
  if (!canvas.value) return;
  const fov = Math.PI / 4;
  const near = 0.1;
  const far = 10;
  const aspect = canvas.value.width / Math.max(1, canvas.value.height);
  const f = 1 / Math.tan(fov / 2);
  const projectionMatrix = new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
  _projectionMatrix = projectionMatrix;
  // upload uniforms now that projection changed
  updateUniforms();
  // recompute screen-space boxes
  try { if (_projectionMatrix && _viewMatrix && _modelMatrix && canvas.value) updateKeyScreenBoxes(); } catch {}
}

// react to octaves control changes and rebuild keyboard at runtime
watch(() => state.value.controls.octaves, (v, oldV) => {
  const oct = Math.max(1, Math.min(8, Math.floor(v || 1)));
  state.value.controls.octaves = oct;
  try {
    if (_device) rebuildKeyboard(oct);
  } catch {}
});

function playNoteForKey(keyIdx: number) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const info: any = _keysInfo[keyIdx];
  if (!info || !info.midi) return;
  const freq = midiToFreq(info.midi);

  const now = ctx.currentTime;
  // voice nodes
  const master = ctx.createGain();
  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.Q.value = 0.9;

  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.14;
  wetGain.connect(master);

  master.gain.value = 0.00001;
  master.connect(ctx.destination);

  // simple feedback delay reverb for body
  const delay = ctx.createDelay(); delay.delayTime.value = 0.115;
  const fb = ctx.createGain(); fb.gain.value = 0.28;
  const fbFilter = ctx.createBiquadFilter(); fbFilter.type = "lowpass"; fbFilter.frequency.value = 3000;
  delay.connect(fbFilter); fbFilter.connect(fb); fb.connect(delay);
  delay.connect(wetGain);

  bodyFilter.connect(master);
  bodyFilter.connect(delay);

  // hammer noise (short filtered burst)
  const noise = ctx.createBufferSource();
  const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
  noise.buffer = nb; noise.loop = false;
  const noiseF = ctx.createBiquadFilter(); noiseF.type = "bandpass"; noiseF.frequency.value = Math.max(1200, freq * 3.5);
  noise.connect(noiseF); noiseF.connect(bodyFilter);

  // additive harmonics with inharmonicity and per-harmonic envelopes
  const harmonics = 8;
  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  for (let h = 1; h <= harmonics; h++) {
    const o = ctx.createOscillator();
    o.type = "sine";
    // small inharmonicity factor for piano-like partials
    const inharm = 1 + 0.0006 * (h * h);
    o.frequency.value = freq * h * inharm;
    const g = ctx.createGain();
    // amplitude ~ 1/h with slight rolloff
    const amp = (1 / h) * Math.pow(0.9, h);
    g.gain.value = 0.00001;
    o.connect(g); g.connect(bodyFilter);
    oscs.push(o); gains.push(g);
    // start
    o.start(now);
    // envelope: sharp attack, faster decay for higher harmonics
    const attack = 0.001 + 0.001 * (h / harmonics);
    // longer harmonic decay for more sustain
    const decay = 1.6 + (h / harmonics) * 1.2;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.00001, now);
    g.gain.linearRampToValueAtTime(amp, now + attack);
    g.gain.exponentialRampToValueAtTime(0.00001, now + attack + decay);
  }

  // body filter brightness envelope (slower decay)
  bodyFilter.frequency.setValueAtTime(Math.max(3000, freq * 6), now);
  bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(900, freq * 1.5), now + 2.8);

  // start noise (hammer)
  noise.start(now);

  // overall master envelope to control perceived level (longer sustain)
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0.00001, now);
  master.gain.linearRampToValueAtTime(1.0, now + 0.004);
  // sustain for several seconds before long decay
  master.gain.exponentialRampToValueAtTime(0.00001, now + 6.0);

  _activeVoices.set(keyIdx, { ctx, master, oscs, gains, noise, delay, fb, fbFilter });
}

function stopNoteForKey(keyIdx: number) {
  const v = _activeVoices.get(keyIdx);
  if (!v) return;
  const { ctx, master, oscs, gains, noise, delay, fb, fbFilter } = v as any;
  const now = ctx.currentTime;
  // ramp master down over a longer release for sustain
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.exponentialRampToValueAtTime(0.00001, now + 8);
  // stop oscillators after a longer tail
  const stopTime = now + 1.6;
  try {
    if (noise) noise.stop(stopTime);
    if (oscs && oscs.length) oscs.forEach((o: OscillatorNode) => o.stop(stopTime));
  } catch {}
  setTimeout(() => {
    try { master.disconnect(); } catch {}
    try { if (delay) delay.disconnect(); if (fb) fb.disconnect(); if (fbFilter) fbFilter.disconnect(); } catch {}
    _activeVoices.delete(keyIdx);
  }, 800);
}
type KeyInfo = {
  baseVertex: number;
  type: "white" | "black";
  cx: number;
  zCenter: number;
  pressed: boolean;
  pivotY?: number;
  pivotZ?: number;
  halfWidth?: number;
  screenX?: number;
  screenY?: number;
  screenHalfW?: number;
  screenMinX?: number;
  screenMaxX?: number;
  screenMinY?: number;
  screenMaxY?: number;
  screenDepth?: number;
};
let _keysInfo: KeyInfo[] = [];
// multi-touch tracking
const _pointerToKey = new Map<number, number>();
const _keyToPointers = new Map<number, Set<number>>();
function mulMat4Vec4(m: Float32Array, v: [number, number, number, number]) {
  const r0 = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
  const r1 = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
  const r2 = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
  const r3 = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];
  return [r0, r1, r2, r3] as [number, number, number, number];
}

function projectToScreen(proj: Float32Array, view: Float32Array, model: Float32Array, pos: [number, number, number], canvasEl: HTMLCanvasElement) {
  const mv = mulMat4Vec4(view, mulMat4Vec4(model, [pos[0], pos[1], pos[2], 1.0]));
  const clip = mulMat4Vec4(proj, mv);
  const w = clip[3] || 1.0;
  const ndcX = clip[0] / w;
  const ndcY = clip[1] / w;
  const x = (ndcX * 0.5 + 0.5) * canvasEl.width;
  const y = (-ndcY * 0.5 + 0.5) * canvasEl.height;
  return { x, y };
}

function updateKeyScreenBoxes() {
  if (!canvas.value || !_projectionMatrix || !_viewMatrix || !_modelMatrix || !_originalVertices) return;
  const proj = _projectionMatrix, view = _viewMatrix, model = _modelMatrix;
  for (let i = 0; i < _keysInfo.length; i++) {
    const info: any = _keysInfo[i];
    const base = info.baseVertex * 9;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumDepth = 0, count = 0;
    for (let v = 0; v < 24; v++) {
      const idx = base + v * 9;
      const px = _originalVertices[idx + 0];
      const py = _originalVertices[idx + 1];
      const pz = _originalVertices[idx + 2];
      const mv = mulMat4Vec4(view, mulMat4Vec4(model, [px, py, pz, 1.0]));
      const clip = mulMat4Vec4(proj, mv);
      const w = clip[3] || 1.0;
      const ndcX = clip[0] / w;
      const ndcY = clip[1] / w;
      const sx = (ndcX * 0.5 + 0.5) * canvas.value.width;
      const sy = (-ndcY * 0.5 + 0.5) * canvas.value.height;
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
      sumDepth += mv[2];
      count++;
    }
    info.screenMinX = minX;
    info.screenMaxX = maxX;
    info.screenMinY = minY;
    info.screenMaxY = maxY;
    info.screenDepth = sumDepth / Math.max(1, count);
  }
}

function drawDebugOverlay() {
  if (!overlay.value || !canvas.value) return;
  const ctx = overlay.value.getContext("2d");
  if (!ctx) return;
  // match size
  overlay.value.width = canvas.value.width;
  overlay.value.height = canvas.value.height;
  overlay.value.style.width = canvas.value.style.width;
  overlay.value.style.height = canvas.value.style.height;
  ctx.clearRect(0, 0, overlay.value.width, overlay.value.height);
  if (!state.value.controls.showHitRegions) return;
  if (!_keysInfo || !_keysInfo.length) return;
  // draw each key's triangles from current vertex positions
  for (let k = 0; k < _keysInfo.length; k++) {
    const info: any = _keysInfo[k];
    const base = info.baseVertex * 9;
    // pick color by type
    const fill = info.type === "white" ? "rgba(30,144,255,0.12)" : "rgba(255,0,0,0.16)";
    const stroke = info.type === "white" ? "rgba(30,144,255,0.6)" : "rgba(200,0,0,0.8)";
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    // draw all triangles (same layout as in findKeyAtPoint)
    const tris = [
      [0,1,2],[0,2,3],
      [4,5,6],[4,6,7],
      [8,9,10],[8,10,11],
      [12,13,14],[12,14,15],
      [16,17,18],[16,18,19],
      [20,21,22],[20,22,23],
    ];
    for (let t = 0; t < tris.length; t++) {
      const [i0, i1, i2] = tris[t];
      const idx0 = base + i0 * 9;
      const idx1 = base + i1 * 9;
      const idx2 = base + i2 * 9;
      const v0 = [_vertices ? _vertices[idx0 + 0] : 0, _vertices ? _vertices[idx0 + 1] : 0, _vertices ? _vertices[idx0 + 2] : 0];
      const v1 = [_vertices ? _vertices[idx1 + 0] : 0, _vertices ? _vertices[idx1 + 1] : 0, _vertices ? _vertices[idx1 + 2] : 0];
      const v2 = [_vertices ? _vertices[idx2 + 0] : 0, _vertices ? _vertices[idx2 + 1] : 0, _vertices ? _vertices[idx2 + 2] : 0];
      const p0 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v0 as any, canvas.value);
      const p1 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v1 as any, canvas.value);
      const p2 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v2 as any, canvas.value);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // draw bounding box if present
    if (info.screenMinX != null) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(info.screenMinX, info.screenMinY, Math.max(1, info.screenMaxX - info.screenMinX), Math.max(1, info.screenMaxY - info.screenMinY));
    }
    // label midi
    if (info.midi != null) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "12px sans-serif";
      if (info.screenMinX != null) ctx.fillText(String(info.midi), info.screenMinX + 4, (info.screenMinY as number) + 12);
    }
  }
}

function _writeVertexSlice(baseVertex: number, updated: Float32Array) {
  if (!_device || !_vertexBuffer) return;
  const offset = baseVertex * 9 * 4; // floats-per-vertex * bytes
  _device.queue.writeBuffer(_vertexBuffer, offset, updated.buffer, updated.byteOffset, updated.byteLength);
}

function setKeyPressed(keyIdx: number, pressed: boolean) {
  if (!_vertices || !_device || !_vertexBuffer || !_originalVertices) return;
  const info: any = _keysInfo[keyIdx];
  if (!info || info.pressed === pressed) return;
  const baseFloat = info.baseVertex * 9;
  // rotate around X axis through pivot (pivotY, pivotZ)
  // use a much smaller angle and invert sign so keys rotate downward
  const maxAngle = 0.6 / 8; // reduced to ~1/8th (~1.3deg)
  const angle = pressed ? maxAngle : 0;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const pivotY = info.pivotY ?? 0;
  const pivotZ = info.pivotZ ?? 0;
  // each key has 24 vertices, 9 floats per vertex
  for (let v = 0; v < 24; v++) {
    const idx = baseFloat + v * 9;
    // original position
    const ox = _originalVertices[idx + 0];
    const oy = _originalVertices[idx + 1];
    const oz = _originalVertices[idx + 2];
    // translate to pivot, rotate around X (y/z)
    const dy = oy - pivotY;
    const dz = oz - pivotZ;
    const ny = cosA * dy - sinA * dz + pivotY;
    const nz = sinA * dy + cosA * dz + pivotZ;
    _vertices[idx + 0] = ox;
    _vertices[idx + 1] = ny;
    _vertices[idx + 2] = nz;

    // rotate normals as directions (no translation)
    const onx = _originalVertices[idx + 6];
    const ony = _originalVertices[idx + 7];
    const onz = _originalVertices[idx + 8];
    const rny = cosA * ony - sinA * onz;
    const rnz = sinA * ony + cosA * onz;
    _vertices[idx + 6] = onx;
    _vertices[idx + 7] = rny;
    _vertices[idx + 8] = rnz;
  }
  // write updated slice back to GPU
  const slice = new Float32Array(_vertices.buffer, info.baseVertex * 9 * 4, 24 * 9);
  _writeVertexSlice(info.baseVertex, slice);
  info.pressed = pressed;
}

function findKeyAtPoint(clientX: number, clientY: number) {
  if (!canvas.value || !_keysInfo || _keysInfo.length === 0) return -1;
  const rect = canvas.value.getBoundingClientRect();
  const px = (clientX - rect.left) * (canvas.value.width / rect.width);
  const py = (clientY - rect.top) * (canvas.value.height / rect.height);
  if (!_vertices) return -1;
  // triangle index layout per key (each face makes two triangles)
  const tris = [
    [0,1,2],[0,2,3], // front
    [4,5,6],[4,6,7], // back
    [8,9,10],[8,10,11], // top
    [12,13,14],[12,14,15], // bottom
    [16,17,18],[16,18,19], // right
    [20,21,22],[20,22,23], // left
  ];
  let bestKey = -1;
  let bestDepth = Infinity;
  // helper: point-in-triangle using barycentric coordinates
  function pointInTri(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
    const v0x = cx - ax, v0y = cy - ay;
    const v1x = bx - ax, v1y = by - ay;
    const v2x = px - ax, v2y = py - ay;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const denom = dot00 * dot11 - dot01 * dot01;
    if (Math.abs(denom) < 1e-8) return false;
    const invDen = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDen;
    const v = (dot00 * dot12 - dot01 * dot02) * invDen;
    return u >= 0 && v >= 0 && (u + v) <= 1;
  }

  const hits: Array<{ key: number; depth: number }> = [];
  for (let k = 0; k < _keysInfo.length; k++) {
    const info: any = _keysInfo[k];
    const base = info.baseVertex * 9;
    for (let t = 0; t < tris.length; t++) {
      const [i0, i1, i2] = tris[t];
      const idx0 = base + i0 * 9;
      const idx1 = base + i1 * 9;
      const idx2 = base + i2 * 9;
      const v0 = [_vertices[idx0 + 0], _vertices[idx0 + 1], _vertices[idx0 + 2]] as [number,number,number];
      const v1 = [_vertices[idx1 + 0], _vertices[idx1 + 1], _vertices[idx1 + 2]] as [number,number,number];
      const v2 = [_vertices[idx2 + 0], _vertices[idx2 + 1], _vertices[idx2 + 2]] as [number,number,number];
      const p0 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v0, canvas.value);
      const p1 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v1, canvas.value);
      const p2 = projectToScreen(_projectionMatrix!, _viewMatrix!, _modelMatrix!, v2, canvas.value);
      if (pointInTri(px, py, p0.x, p0.y, p1.x, p1.y, p2.x, p2.y)) {
        const mv0 = mulMat4Vec4(_viewMatrix!, mulMat4Vec4(_modelMatrix!, [v0[0], v0[1], v0[2], 1]));
        const mv1 = mulMat4Vec4(_viewMatrix!, mulMat4Vec4(_modelMatrix!, [v1[0], v1[1], v1[2], 1]));
        const mv2 = mulMat4Vec4(_viewMatrix!, mulMat4Vec4(_modelMatrix!, [v2[0], v2[1], v2[2], 1]));
        const depth = (mv0[2] + mv1[2] + mv2[2]) / 3;
        hits.push({ key: k, depth });
      }
    }
  }
  if (hits.length === 0) return -1;
  // prefer black keys among hits; otherwise pick the nearest hit
  const blackHits = hits.filter(h => (_keysInfo[h.key] as any).type === "black");
  const choose = (arr: Array<{ key: number; depth: number }>) => {
    let best = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i].depth > best.depth) best = arr[i];
    return best.key;
  };
  if (blackHits.length > 0) return choose(blackHits);
  return choose(hits);
}

function onCanvasPointerDown(e: PointerEvent) {
  if (!canvas.value) return;
  const pid = e.pointerId;
  const idx = findKeyAtPoint(e.clientX, e.clientY);
  if (idx >= 0) {
    // map pointer->key
    _pointerToKey.set(pid, idx);
    let s = _keyToPointers.get(idx);
    if (!s) { s = new Set(); _keyToPointers.set(idx, s); }
    const prevCount = s.size;
    s.add(pid);
    // only trigger press/play on first pointer for this key
    if (prevCount === 0) {
      setKeyPressed(idx, true);
      playNoteForKey(idx);
    }
  }
  try { canvas.value.setPointerCapture?.(pid); } catch {}
}

function onPointerUpOrCancel(e: PointerEvent) {
  const pid = e.pointerId;
  const idx = _pointerToKey.get(pid);
  if (idx == null) return;
  _pointerToKey.delete(pid);
  const s = _keyToPointers.get(idx);
  if (s) {
    s.delete(pid);
    if (s.size === 0) {
      _keyToPointers.delete(idx);
      setKeyPressed(idx, false);
      stopNoteForKey(idx);
    }
  }
  try { canvas.value?.releasePointerCapture?.(pid); } catch {}
}

function onCanvasPointerMove(e: PointerEvent) {
  if (!canvas.value) return;
  const pid = e.pointerId;
  // Ignore mouse hover (no buttons pressed) to avoid triggering presses on mouseover
  if (e.pointerType === "mouse" && (e.buttons === 0)) return;
  const prevKey = _pointerToKey.get(pid);
  const curKey = findKeyAtPoint(e.clientX, e.clientY);
  if (prevKey == null) {
    // pointer had no mapping; if it moved onto a key, press it
    if (curKey >= 0) {
      _pointerToKey.set(pid, curKey);
      let s = _keyToPointers.get(curKey);
      if (!s) { s = new Set(); _keyToPointers.set(curKey, s); }
      const prevCount = s.size;
      s.add(pid);
      if (prevCount === 0) { setKeyPressed(curKey, true); playNoteForKey(curKey); }
      try { canvas.value.setPointerCapture?.(pid); } catch {}
    }
    return;
  }

  if (curKey === prevKey) return; // still on same key

  // moved off previous key: release it for this pointer
  _pointerToKey.delete(pid);
  const sPrev = _keyToPointers.get(prevKey);
  if (sPrev) {
    sPrev.delete(pid);
    if (sPrev.size === 0) {
      _keyToPointers.delete(prevKey);
      setKeyPressed(prevKey, false);
      stopNoteForKey(prevKey);
    }
  }

  // if moved onto another key, press that one
  if (curKey >= 0) {
    _pointerToKey.set(pid, curKey);
    let s = _keyToPointers.get(curKey);
    if (!s) { s = new Set(); _keyToPointers.set(curKey, s); }
    const prevCount = s.size;
    s.add(pid);
    if (prevCount === 0) { setKeyPressed(curKey, true); playNoteForKey(curKey); }
    try { canvas.value.setPointerCapture?.(pid); } catch {}
  } else {
    try { canvas.value.releasePointerCapture?.(pid); } catch {}
  }
}

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

    // build keyboard geometry according to configured octaves
    rebuildKeyboard(state.value.controls?.octaves ?? 2);

    // Uniform buffer for MVP matrices and light direction
    _uniformBuffer = _device.createBuffer({
      size: 208, // 3x 4x4 matrices * 4 + 4 floats for light
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    // View and model matrices
    const viewAngleX = -Math.PI / 3;
    const cosVX = Math.cos(viewAngleX);
    const sinVX = Math.sin(viewAngleX);
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, cosVX, sinVX, 0,
      0, -sinVX, cosVX, 0,
      0, 0, -3, 1,
    ]);
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

    // store view/model globally and compute/upload projection using canvas aspect
    _viewMatrix = viewMatrix;
    _modelMatrix = modelMatrix;
    updateProjection();

    // half-width per key is computed in `rebuildKeyboard`

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

  // update projection/uniforms and recompute screen-space projections for hit testing
  try {
    if (_viewMatrix && _modelMatrix) updateProjection();
    if (_projectionMatrix && _viewMatrix && _modelMatrix && canvas.value && _keysInfo && _keysInfo.length) {
      updateKeyScreenBoxes();
    }
  } catch {}

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
    // draw debug overlay after GPU frame
    try {
      drawDebugOverlay();
    } catch {}
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
  // add pointer handlers for key presses
  try {
    canvas.value?.addEventListener("pointerdown", onCanvasPointerDown);
    canvas.value?.addEventListener("pointermove", onCanvasPointerMove, { passive: false } as any);
    window.addEventListener("pointerup", onPointerUpOrCancel);
    window.addEventListener("pointercancel", onPointerUpOrCancel);
    // prevent long-press context menu on canvas/container
    _onContextMenu = (ev: Event) => { ev.preventDefault(); };
    try {
      canvas.value?.addEventListener("contextmenu", _onContextMenu);
      container.value?.addEventListener("contextmenu", _onContextMenu);
    } catch {}
  } catch {}
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
  if (_onContextMenu) {
    try {
      canvas.value?.removeEventListener("contextmenu", _onContextMenu);
      container.value?.removeEventListener("contextmenu", _onContextMenu);
    } catch {}
    _onContextMenu = null;
  }
  try {
    canvas.value?.removeEventListener("pointerdown", onCanvasPointerDown);
    canvas.value?.removeEventListener("pointermove", onCanvasPointerMove as any);
    window.removeEventListener("pointerup", onPointerUpOrCancel);
    window.removeEventListener("pointercancel", onPointerUpOrCancel);
  } catch {}
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

.overlay-canvas {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 30;
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
