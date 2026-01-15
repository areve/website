export async function setupNewtonRenderer(
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
    label: "newton shader",
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

      fn mag2(x: f32, y: f32) -> f32 { return x*x + y*y; }

      fn newton_iterations(cx: f32, cy: f32) -> f32 {
        var xr = cx;
        var yi = cy;
        let maxIter: i32 = 50;
        let tol: f32 = 1e-6;
        var i: i32 = 0;
        loop {
          if (i >= maxIter) { break; }
          // compute z^3 = (xr + i yi)^3
          let xr2 = xr*xr;
          let yi2 = yi*yi;
          let xr3 = xr2 * xr - 3.0 * xr * yi2; // real part
          let yi3 = 3.0 * xr2 * yi - yi2 * yi; // imag part

          // p = z^3 - 1  => (xr3 - 1) + i yi3
          let pr = xr3 - 1.0;
          let pi = yi3;

          // derivative p' = 3 z^2 => 3*(xr^2 - yi^2) + i*6*xr*yi
          let dr = 3.0 * (xr2 - yi2);
          let di = 6.0 * xr * yi;

          let denom = dr*dr + di*di;
          if (denom == 0.0) { break; }

          // complex division: (p * conj(d)) / |d|^2
          let nr = pr*dr + pi*di;
          let ni = pi*dr - pr*di;

          let xrNew = xr - nr/denom;
          let yiNew = yi - ni/denom;

          if (abs(xrNew - xr) < tol && abs(yiNew - yi) < tol) { xr = xrNew; yi = yiNew; break; }
          xr = xrNew;
          yi = yiNew;
          i = i + 1;
        }
        return f32(i) / f32(maxIter);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // map pixel to complex plane similar to existing noise page
        let cReal = (coord.x / 200.0) - 2.0 + data.x;
        let cImag = (coord.y / 200.0) - 0.25 + data.y;
        let v = newton_iterations(cReal, cImag);
        let m = clamp(1.0 - v, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "newton pipeline",
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
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "newton renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "newton encoder" });
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
