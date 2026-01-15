export async function setupTrigonometryRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number; seed?: number; scale?: number }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
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
    // Ensure the canvas context is configured for the stored device/format
    try {
      context.configure({ device, format: presentationFormat });
    } catch (e) {
      // Some environments may throw if configure is called redundantly; ignore
    }
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

@group(0) @binding(0) var<uniform> data: Uniforms;

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

// default 'twirly' distortion ported from JS generator
fn distort_twirly(cx: f32, cy: f32, r: f32, theta: f32) -> vec2<f32> {
  let dx = cx + r * cos(theta + pow(r, 0.5) * 5.0) + cy / 5.0;
  let dy = cy + r * sin(theta + pow(r, 0.7) * 5.0) + cx / 3.0;
  return vec2<f32>(dx, dy);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let w = screenToWorld(coord);
  let cx = w.x / 3.0 - 20.0;
  let cy = w.y / 3.0 - 10.0;
  let r = sqrt(cx * cx + cy * cy) / 8.0;
  let theta = atan2(cy, cx);
  let d = distort_twirly(cx, cy, r, theta);
  let seed = data.seed;
  let value = sin(d.x * 1.0 + seed) * sin(d.y * 1.0 + seed);
  let v = abs(value);
  return vec4<f32>(v, v, v, 1.0);
}
`;

  const module = device.createShaderModule({ label: "trig shader", code: shader });

  const pipeline = device.createRenderPipeline({
    label: "trig pipeline",
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
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "trig renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "trig encoder" });
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
