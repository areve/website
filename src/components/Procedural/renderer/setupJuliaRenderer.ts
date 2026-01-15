export async function setupJuliaRenderer(
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
    label: "julia shader",
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

      fn julia(cRe: f32, cIm: f32, r0: f32, i0: f32) -> f32 {
        var r = r0;
        var i = i0;
        let maxIterations: i32 = 150;
        var iteration: i32 = 0;
        loop {
          if (r * r + i * i > 4.0 || iteration >= maxIterations) { break; }
          let rTemp = r * r - i * i + cRe;
          i = 2.0 * r * i + cIm;
          r = rTemp;
          iteration = iteration + 1;
        }
        return f32(iteration) / f32(maxIterations);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map screen -> world -> apply rotation, similar to Mandelbrot shader
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

        // Convert world coords to complex plane using Mandelbrot-style constants
        let worldToComplex: f32 = 0.06;
        let r0 = worldX * worldToComplex - 2.5;
        let i0 = worldY * worldToComplex - 1.875;

        // Animated Julia constant from uniform z
        let cRe = 0.355 + sin(data.z) / 200.0;
        let cIm = 0.355 + cos(data.z) / 200.0;

        let n = julia(cRe, cIm, r0, i0);
        let color = vec3f(n, pow(n, 0.5), 1.0 - n);
        return vec4f(color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "julia pipeline",
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
  const renderPassDescriptor: GPURenderPassDescriptor = { label: "julia renderPass", colorAttachments: [colorAttachment] };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "julia encoder" });
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
