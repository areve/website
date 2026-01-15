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
      
      fn smootherstep(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + (b - a) * t; }


      fn noise(ix: i32, iy: i32, iz: i32) -> u32 {
        let seed_u: u32 = u32(data.seed);
        let n: u32 = seed_u + u32(ix) * 374761393u + u32(iy) * 668265263u + u32(iz) * 1440662683u;
        return (n ^ (n >> 13u)) * 1274126177u;
      }


      const GRAD_TABLE: array<vec3<f32>, 12> = array<vec3<f32>, 12>(
        vec3<f32>(1.0, 1.0, 0.0),
        vec3<f32>(-1.0, 1.0, 0.0),
        vec3<f32>(1.0, -1.0, 0.0),
        vec3<f32>(-1.0, -1.0, 0.0),
        vec3<f32>(1.0, 0.0, 1.0),
        vec3<f32>(-1.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, -1.0),
        vec3<f32>(-1.0, 0.0, -1.0),
        vec3<f32>(0.0, 1.0, 1.0),
        vec3<f32>(0.0, -1.0, 1.0),
        vec3<f32>(0.0, 1.0, -1.0),
        vec3<f32>(0.0, -1.0, -1.0)
      );

      fn gradIndex(h: u32) -> u32 {
        return ((h ^ (h >> 15u)) & 63u) % 12u;
      }

      fn grad(h: u32) -> vec3<f32> {
        return GRAD_TABLE[gradIndex(h)];
      }

      fn perlin3d(x: f32, y: f32, z: f32) -> f32 {
        // Find unit grid cell containing point
        var X = i32(floor(x));
        var Y = i32(floor(y));
        var Z = i32(floor(z));

        // Get relative xyz coordinates of point within that cell
        let fx = x - f32(X);
        let fy = y - f32(Y);
        let fz = z - f32(Z);

        // Wrap the integer cells at 255
        X = X & 255;
        Y = Y & 255;
        Z = Z & 255;

        // Calculate hashed gradients and dot products for each corner (inlined hash->grad)
        let n000 = dot(grad(noise(X, Y, Z)), vec3<f32>(fx, fy, fz));
        let n001 = dot(grad(noise(X, Y, (Z + 1) & 255)), vec3<f32>(fx, fy, fz - 1.0));
        let n010 = dot(grad(noise(X, (Y + 1) & 255, Z)), vec3<f32>(fx, fy - 1.0, fz));
        let n011 = dot(grad(noise(X, (Y + 1) & 255, (Z + 1) & 255)), vec3<f32>(fx, fy - 1.0, fz - 1.0));
        let n100 = dot(grad(noise((X + 1) & 255, Y, Z)), vec3<f32>(fx - 1.0, fy, fz));
        let n101 = dot(grad(noise((X + 1) & 255, Y, (Z + 1) & 255)), vec3<f32>(fx - 1.0, fy, fz - 1.0));
        let n110 = dot(grad(noise((X + 1) & 255, (Y + 1) & 255, Z)), vec3<f32>(fx - 1.0, fy - 1.0, fz));
        let n111 = dot(grad(noise((X + 1) & 255, (Y + 1) & 255, (Z + 1) & 255)), vec3<f32>(fx - 1.0, fy - 1.0, fz - 1.0));

        // Compute the fade curve value for fx, fy, fz
        let u = smootherstep(fx);
        let v = smootherstep(fy);
        let w = smootherstep(fz);

        // Interpolate: u inner, w mid, v outer (matches reference implementation)
        let ix0 = lerp(n000, n100, u);
        let ix1 = lerp(n010, n110, u);
        let iy0 = lerp(ix0, ix1, v);

        let jx0 = lerp(n001, n101, u);
        let jx1 = lerp(n011, n111, u);
        let jy0 = lerp(jx0, jx1, v);

        let value = lerp(iy0, jy0, w);
        return clamp(value * 0.9649214148521423, -1.0, 1.0);
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
        let m = clamp(n * 0.5 + 0.5, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
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
