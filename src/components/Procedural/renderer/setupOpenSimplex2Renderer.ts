export async function setupOpenSimplex2Renderer(
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
    label: "opensimplex2 shader",
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

      // 2D Simplex noise (Gustavson) adapted to WGSL
      const C0: f32 = 0.3660254037844386; // (sqrt(3)-1)/2
      const C1: f32 = 0.21132486540518713; // (3-sqrt(3))/6

      fn mod289(x: vec3f) -> vec3f { return x - floor(x / 289.0) * 289.0; }
      fn permute(x: vec3f) -> vec3f { return mod289(((x * 34.0) + 1.0) * x); }

      fn snoise2(v: vec2f) -> f32 {
        let s: f32 = (v.x + v.y) * C0;
        let i: vec2f = floor(v + vec2f(s, s));
        let t: f32 = (i.x + i.y) * C1;
        let X0: vec2f = i - vec2f(t, t);
        let x0: vec2f = v - X0;

        var i1: vec2f;
        if (x0.x > x0.y) {
          i1 = vec2f(1.0, 0.0);
        } else {
          i1 = vec2f(0.0, 1.0);
        }

        let x12: vec4f = vec4f(x0.x - i1.x + C1, x0.y - i1.y + C1, x0.x - 1.0 + 2.0 * C1, x0.y - 1.0 + 2.0 * C1);

        var ii: vec3f = vec3f(i.y, i.y + i1.y, i.y + 1.0);
        var jj: vec3f = vec3f(i.x, i.x + i1.x, i.x + 1.0);
        var perm = permute(permute(ii) + jj);

        var m: vec3f;
        m.x = max(0.5 - dot(x0, x0), 0.0);
        m.y = max(0.5 - dot(x12.xy, x12.xy), 0.0);
        m.z = max(0.5 - dot(x12.zw, x12.zw), 0.0);
        m = m * m;
        m = m * m;

        // Gradients: convert perm to gradients
        let permf = fract(perm * (1.0 / 41.0));
        let gx = permf * 2.0 - 1.0;
        let gy = abs(gx) - 0.5;
        let ox = floor(gx + 0.5);
        let ax = gx - ox;

        let g0 = vec2f(ax.x, gy.x);
        let g1 = vec2f(ax.y, gy.y);
        let g2 = vec2f(ax.z, gy.z);

        let n0 = m.x * dot(g0, x0);
        let n1 = m.y * dot(g1, x12.xy);
        let n2 = m.z * dot(g2, x12.zw);

        return 130.0 * (n0 + n1 + n2);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0) , vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;

        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;

        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;

        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;

        // Translate back
        let x = rotX + centerX;
        let y = rotY + centerY;

        // Animate by adding small z offset into coordinates
        let t = data.z * 0.001;
        let n = snoise2(vec2f(x + t, y + t));
        // remap from roughly [-1,1] to [0,1]
        let v = n * 0.5 + 0.5;
        return vec4f(v, v, v, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
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
    label: "our basic canvas renderPass",
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
      const encoder = device.createCommandEncoder({ label: "our encoder" });
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

function fail(msg: string) {
  throw new Error(msg);
}
