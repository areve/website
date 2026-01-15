export async function setupValueRenderer(
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
  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    label: "value shader",
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

      // inlined at call sites for performance
      fn smootherstep(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + t * (b - a); }

      const PRIME_X: i32 = 501125321;
      const PRIME_Y: i32 = 1136930381;
      const PRIME_Z: i32 = 1720413743;

      fn noise(seed: i32, xi: i32, yi: i32, zi: i32) -> f32 {
        let seed_u: u32 = u32(seed);
        let n: u32 = seed_u + u32(xi) * 374761393u + u32(yi) * 668265263u + u32(zi) * 1440662683u;
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        var h: i32 = bitcast<i32>(m);
        return f32(h) * (1.0 / 2147483648.0);
      }

      fn value3d(x: f32, y: f32, z: f32) -> f32 {
        let x0 = i32(floor(x));
        let y0 = i32(floor(y));
        let z0 = i32(floor(z));

        let xs = smootherstep(x - f32(x0));
        let ys = smootherstep(y - f32(y0));
        let zs = smootherstep(z - f32(z0));

        let xp = x0 * PRIME_X;
        let yp = y0 * PRIME_Y;
        let zp = z0 * PRIME_Z;
        let x1 = xp + PRIME_X;
        let y1 = yp + PRIME_Y;
        let z1 = zp + PRIME_Z;

        let xf00 = lerp(noise(i32(data.seed), xp, yp, zp), noise(i32(data.seed), x1, yp, zp), xs);
        let xf10 = lerp(noise(i32(data.seed), xp, y1, zp), noise(i32(data.seed), x1, y1, zp), xs);
        let xf01 = lerp(noise(i32(data.seed), xp, yp, z1), noise(i32(data.seed), x1, yp, z1), xs);
        let xf11 = lerp(noise(i32(data.seed), xp, y1, z1), noise(i32(data.seed), x1, y1, z1), xs);

        let yf0 = lerp(xf00, xf10, ys);
        let yf1 = lerp(xf01, xf11, ys);

        return lerp(yf0, yf1, zs);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        let x = rotX + centerX;
        let y = rotY + centerY;

        let n = value3d(x, y, data.z);
        let m = clamp(n * 0.5 + 0.5, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "value pipeline",
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

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "value renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "value encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}

function fail(msg: string) { throw new Error(msg); }
