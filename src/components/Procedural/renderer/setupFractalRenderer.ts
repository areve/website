export async function setupFractalRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number; seed?: number; scale?: number }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 1337,
    scale: options.scale ?? 8,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotation: 0,
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        this.rotation,
      ]);
    },
  };

  const canvasAny = canvas as any;
  const context = canvas.getContext("webgpu")!;
  let device: GPUDevice;
  let presentationFormat: GPUTextureFormat;

  if (canvasAny.__wgpu_device) {
    device = canvasAny.__wgpu_device as GPUDevice;
    presentationFormat = canvasAny.__wgpu_format as GPUTextureFormat;
  } else {
    const adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice()!;
    if (!device) return fail("need a browser that supports WebGPU");
    presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: presentationFormat });
    canvasAny.__wgpu_device = device;
    canvasAny.__wgpu_format = presentationFormat;
  }

  canvas.width = options.width;
  canvas.height = options.height;

  const shader = /* wgsl */ `
  struct Uniforms {
    width: f32,
    height: f32,
    seed: f32,
    scale: f32,
    x: f32,
    y: f32,
    z: f32,
    zoom: f32,
    rotation: f32,
  };

@group(0) @binding(0) var<uniform> data : Uniforms;

// Simple PRNG-based noise used by OpenSimplex implementation
fn noise(seed: f32, coord: vec4<f32>) -> f32 {
  let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
  let m: u32 = (n ^ (n >> 13)) * 1274126177u;
  return f32(m) / f32(0xffffffffu);
}

const skew3d: f32 = 1.0 / 3.0;
const unskew3d: f32 = 1.0 / 6.0;
const rSquared3d: f32 = 3.0 / 4.0;

fn vertexContribution(seed: f32, ix: i32, iy: i32, iz: i32, fx: f32, fy: f32, fz: f32, cx: i32, cy: i32, cz: i32) -> f32 {
  let dx: f32 = fx - f32(cx);
  let dy: f32 = fy - f32(cy);
  let dz: f32 = fz - f32(cz);
  let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
  let dxs: f32 = dx - skewedOffset;
  let dys: f32 = dy - skewedOffset;
  let dzs: f32 = dz - skewedOffset;

  let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
  if (a < 0.0) { return 0.0; }
  let h: i32 = bitcast<i32>(noise(data.seed, vec4<f32>(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
  let u: i32 = (h & 0xf) - 8;
  let v: i32 = ((h >> 4) & 0xf) - 8;
  let w: i32 = ((h >> 8) & 0xf) - 8;
  return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
}

fn openSimplex3d(seed: f32, x: f32, y: f32, z: f32) -> f32 {
  let sx: f32 = x;
  let sy: f32 = y;
  let sz: f32 = z;
  let skew: f32 = (sx + sy + sz) * skew3d;
  let ix: i32 = i32(floor(sx + skew));
  let iy: i32 = i32(floor(sy + skew));
  let iz: i32 = i32(floor(sz + skew));
  let fx: f32 = sx + skew - f32(ix);
  let fy: f32 = sy + skew - f32(iy);
  let fz: f32 = sz + skew - f32(iz);

  return 0.5 + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,0,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,0,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,1,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,1,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,0,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,0,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,1,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,1,1);
}

fn fractalNoise(seed: f32, x: f32, y: f32, z: f32, numLayers: u32) -> f32 {
  var total: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var frequency: f32 = 1.0;
  var maxAmplitude: f32 = 0.0;
  var i: u32 = 0u;
  loop {
    if (i >= numLayers) { break; }
    let noiseVal = openSimplex3d(seed * f32(i * 10000u + 12345u), x * frequency, y * frequency, z * frequency);
    total = total + noiseVal * amplitude;
    maxAmplitude = maxAmplitude + amplitude;
    amplitude = amplitude * 0.35;
    frequency = frequency * 4.0;
    i = i + 1u;
  }
  return total / maxAmplitude;
}

fn screenToWorld(coord: vec4<f32>) -> vec2<f32> {
  let centerScreenX = data.width / 2.0;
  let centerScreenY = data.height / 2.0;
  let scale = data.scale;
  let baseX = coord.x / scale * data.zoom + data.x / scale;
  let baseY = coord.y / scale * data.zoom + data.y / scale;
  let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
  let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;
  let relX = baseX - centerWorldX;
  let relY = baseY - centerWorldY;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let rotX = relX * cos_r - relY * sin_r;
  let rotY = relX * sin_r + relY * cos_r;
  return vec2<f32>(rotX + centerWorldX, rotY + centerWorldY);
}

@vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array<vec2<f32>, 6>(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0), vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, -1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let w = screenToWorld(coord);
  let v = fractalNoise(data.seed, w.x / 128.0, w.y / 128.0, data.z, 4u);
  return vec4<f32>(v, v, v, 1.0);
}
`;

  const module = device.createShaderModule({ label: "fractal shader", code: shader });

  const pipeline = device.createRenderPipeline({
    label: "fractal pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: { module, entryPoint: "fs", targets: [{ format: presentationFormat }] },
  });

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const colorAttachment: GPURenderPassColorAttachment = { view: undefined! as GPUTextureView, clearValue: [0,0,0,1], loadOp: "clear", storeOp: "store" };
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "fractal renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "fractal encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const cb = encoder.finish();
      device.queue.submit([cb]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}

function fail(msg: string) { throw new Error(msg); }
