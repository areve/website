export async function setupValueCubicRenderer(
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
    label: "valueCubic shader",
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

      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + (b - a) * t; }

      fn cubic_interp(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
        let a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
        let b = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
        let c = -0.5 * p0 + 0.5 * p2;
        let d = p1;
        return ((a * t + b) * t + c) * t + d;
      }

      const PRIME_X: i32 = 501125321;
      const PRIME_Y: i32 = 1136930381;
      const PRIME_Z: i32 = 1720413743;

      fn noise(seed: i32, xPrimed: i32, yPrimed: i32, zPrimed: i32) -> i32 {
        let seed_u: u32 = u32(seed);
        let n: u32 = seed_u + u32(xPrimed) * 374761393u + u32(yPrimed) * 668265263u + u32(zPrimed) * 1440662683u;
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        return bitcast<i32>(m);
      }

      fn _fnlValCoord3D(seed: i32, xPrimed: i32, yPrimed: i32, zPrimed: i32) -> f32 {
        var hash = noise(seed, xPrimed, yPrimed, zPrimed);
        hash = hash * hash;
        hash = hash ^ (hash << 19);
        return f32(hash) * (1.0 / 2147483648.0);
      }

      fn value_cubic3d(x: f32, y: f32, z: f32) -> f32 {
        let ix = i32(floor(x));
        let iy = i32(floor(y));
        let iz = i32(floor(z));

        let fx = x - f32(ix);
        let fy = y - f32(iy);
        let fz = z - f32(iz);

        let x1 = ix * PRIME_X;
        let y1 = iy * PRIME_Y;
        let z1 = iz * PRIME_Z;
        let x0 = x1 - PRIME_X;
        let y0 = y1 - PRIME_Y;
        let z0 = z1 - PRIME_Z;
        let x2 = x1 + PRIME_X;
        let y2 = y1 + PRIME_Y;
        let z2 = z1 + PRIME_Z;
        let x3 = x1 + PRIME_X * 2;
        let y3 = y1 + PRIME_Y * 2;
        let z3 = z1 + PRIME_Z * 2;

        var col: array<f32, 4>;
        var plane: array<f32, 4>;
        var row: array<f32, 4>;

        let xpArr: array<i32,4> = array<i32,4>(x0, x1, x2, x3);
        let ypArr: array<i32,4> = array<i32,4>(y0, y1, y2, y3);
        let zpArr: array<i32,4> = array<i32,4>(z0, z1, z2, z3);

        for (var kz: i32 = 0; kz < 4; kz = kz + 1) {
          let zp = zpArr[kz];
          for (var ky: i32 = 0; ky < 4; ky = ky + 1) {
            let yp = ypArr[ky];
            for (var kx: i32 = 0; kx < 4; kx = kx + 1) {
              let xp = xpArr[kx];
              row[kx] = _fnlValCoord3D(i32(data.seed), xp, yp, zp);
            }
            col[ky] = cubic_interp(row[0], row[1], row[2], row[3], fx);
          }
          plane[kz] = cubic_interp(col[0], col[1], col[2], col[3], fy);
        }

        return cubic_interp(plane[0], plane[1], plane[2], plane[3], fz) * (1.0 / (1.5 * 1.5));
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

        let n = value_cubic3d(x, y, data.z);
        // invert mapping so bright/dark match expectations (white = high)
        let m = clamp(1.0 - (n * 0.5 + 0.5), 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "valueCubic pipeline",
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
    label: "valueCubic renderPass",
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
      const encoder = device.createCommandEncoder({ label: "valueCubic encoder" });
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
