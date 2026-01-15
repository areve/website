export async function setupLorenzRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
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
    label: "lorenz shader",
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

      fn lorenz_step(x: f32, y: f32, z: f32, dt: f32, sigma: f32, rho: f32, beta: f32) -> vec3<f32> {
        let dx = sigma * (y - x);
        let dy = x * (rho - z) - y;
        let dz = x * y - beta * z;
        return vec3<f32>(x + dx * dt, y + dy * dt, z + dz * dt);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map screen -> world -> apply rotation (match Mandelbrot transform)
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

        let worldX = rotX + centerWorldX;
        let worldY = rotY + centerWorldY;

        // Initial conditions from world coords (scaled down)
        // Zoom out 10x: use smaller multiplier so the attractor is visible at default zoom
        var x = worldX * 0.002;
        var y = worldY * 0.002;
        var z = 25.0 + sin(data.z) * 5.0;

        let sigma = 10.0;
        let rho = 28.0;
        let beta = 8.0 / 3.0;
        let dt = 0.01;
        let steps: i32 = 128;

        var i: i32 = 0;
        loop {
          if (i >= steps) { break; }
          let next = lorenz_step(x, y, z, dt, sigma, rho, beta);
          x = next.x;
          y = next.y;
          z = next.z;
          i = i + 1;
        }

        // Derive hue from angular position, value from z (depth), produce saturated colors
        let PI: f32 = 3.141592653589793;
        let h = fract((atan2(y, x) / (2.0 * PI)) + 0.5);
        let v = clamp(0.2 + (z / 60.0), 0.0, 1.0);
        let s = 0.95;

        // HSV -> RGB
        let c = v * s;
        let hp = h * 6.0;
        let xcol = c * (1.0 - abs(fract(hp) * 2.0 - 1.0));
        var r: f32 = 0.0;
        var g: f32 = 0.0;
        var b: f32 = 0.0;
        if (hp < 1.0) {
          r = c; g = xcol; b = 0.0;
        } else if (hp < 2.0) {
          r = xcol; g = c; b = 0.0;
        } else if (hp < 3.0) {
          r = 0.0; g = c; b = xcol;
        } else if (hp < 4.0) {
          r = 0.0; g = xcol; b = c;
        } else if (hp < 5.0) {
          r = xcol; g = 0.0; b = c;
        } else {
          r = c; g = 0.0; b = xcol;
        }
        let m = v - c;
        let color = vec3f(r + m, g + m, b + m);
        return vec4f(color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "lorenz pipeline",
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
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "lorenz renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "lorenz encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const cb = encoder.finish();
      device.queue.submit([cb]);
      return device.queue.onSubmittedWorkDone();
    }
  };
}

function fail(msg: string) { throw new Error(msg); }
