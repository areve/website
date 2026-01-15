export async function setupPerlinRenderer(
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
    label: "perlin shader",
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

      fn fract(x: f32) -> f32 { return x - floor(x); }
      fn fade(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

      fn hashf(v: vec3<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(v.x * 374761393.0) +
          bitcast<u32>(v.y * 668265263.0) +
          bitcast<u32>(v.z * 1440662683.0);
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        return f32(m) / f32(0xffffffffu);
      }

      fn gradFromHash(h: i32) -> vec3<f32> {
        // Use 16 possible gradients
        let idx = u32(h & 15);
        let g0 = vec3<f32>(1.0,1.0,0.0);
        let g1 = vec3<f32>(-1.0,1.0,0.0);
        let g2 = vec3<f32>(1.0,-1.0,0.0);
        let g3 = vec3<f32>(-1.0,-1.0,0.0);
        let g4 = vec3<f32>(1.0,0.0,1.0);
        let g5 = vec3<f32>(-1.0,0.0,1.0);
        let g6 = vec3<f32>(1.0,0.0,-1.0);
        let g7 = vec3<f32>(-1.0,0.0,-1.0);
        let g8 = vec3<f32>(0.0,1.0,1.0);
        let g9 = vec3<f32>(0.0,-1.0,1.0);
        let g10 = vec3<f32>(0.0,1.0,-1.0);
        let g11 = vec3<f32>(0.0,-1.0,-1.0);
        let g12 = vec3<f32>(1.0,1.0,0.0);
        let g13 = vec3<f32>(-1.0,1.0,0.0);
        let g14 = vec3<f32>(0.0,-1.0,1.0);
        let g15 = vec3<f32>(0.0,-1.0,-1.0);
        let table = array<vec3<f32>,16>(g0,g1,g2,g3,g4,g5,g6,g7,g8,g9,g10,g11,g12,g13,g14,g15);
        return table[idx];
      }

      fn perlin3d(x: f32, y: f32, z: f32) -> f32 {
        let X = i32(floor(x));
        let Y = i32(floor(y));
        let Z = i32(floor(z));
        let xf = x - f32(X);
        let yf = y - f32(Y);
        let zf = z - f32(Z);

        let u = fade(xf);
        let v = fade(yf);
        let w = fade(zf);

        var accum: f32 = 0.0;
        for (var ix: i32 = 0; ix <= 1; ix = ix + 1) {
          for (var iy: i32 = 0; iy <= 1; iy = iy + 1) {
            for (var iz: i32 = 0; iz <= 1; iz = iz + 1) {
              let corner = vec3<f32>(f32(X + ix), f32(Y + iy), f32(Z + iz));
              let gradHash = i32(bitcast<i32>(hashf(corner)));
              let grad = gradFromHash(gradHash);
              let diff = vec3<f32>(xf - f32(ix), yf - f32(iy), zf - f32(iz));
              let dotv = dot(grad, diff);
              let sx = select(1.0 - u, u, ix == 1);
              let sy = select(1.0 - v, v, iy == 1);
              let sz = select(1.0 - w, w, iz == 1);
              accum = accum + dotv * sx * sy * sz;
            }
          }
        }
        return clamp(accum * 2.0, -1.0, 1.0);
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

        let n = perlin3d(x, y, data.z);
        return vec4<f32>(n, n, n, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "perlin pipeline",
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
    label: "perlin renderPass",
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
      const encoder = device.createCommandEncoder({ label: "perlin encoder" });
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
