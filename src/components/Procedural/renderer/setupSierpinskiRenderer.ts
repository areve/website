export async function setupSierpinskiRenderer(
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

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: presentationFormat });

  const module = device.createShaderModule({
    label: "sierpinski shader",
    code: /* wgsl */ `
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      // Map screen -> world -> rotate like Mandelbrot so controller panning/rotation work
      fn screenToWorld(coord: vec4<f32>) -> vec2f {
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
        return vec2f(rotX + centerWorldX, rotY + centerWorldY);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let w = screenToWorld(coord);
        // choose a scaling factor controlling fractal frequency
        let freq = 64.0; // adjust for detail

        // Convert to positive integer grid coordinates
        let fx = abs(w.x) * freq;
        let fy = abs(w.y) * freq;
        let ix: u32 = u32(fx);
        let iy: u32 = u32(fy);

        // Sierpinski condition via bitwise AND: points where (ix & iy) == 0 are part of the set
        let inside = (ix & iy) == 0u;

        // color: white when inside, dark otherwise; map z to subtle animation tint
        let t = fract(data.z);
        if (inside) {
          return vec4f(0.97 + 0.03 * sin(t * 6.2831), 0.97 + 0.03 * sin(t * 6.2831 + 2.0), 0.97 + 0.03 * sin(t * 6.2831 + 4.0), 1.0);
        }
        return vec4f(0.06, 0.06, 0.06, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "sierpinski pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format: presentationFormat }] },
  });

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const colorAttachment: GPURenderPassColorAttachment = { view: undefined! as GPUTextureView, clearValue: [0.0,0.0,0.0,1], loadOp: "clear", storeOp: "store" };
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "sierpinski renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "sierpinski encoder" });
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
