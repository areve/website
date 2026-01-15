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

      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }


      const G0 = vec3<f32>(1.0, 1.0, 0.0);
      const G1 = vec3<f32>(-1.0, 1.0, 0.0);
      const G2 = vec3<f32>(1.0, -1.0, 0.0);
      const G3 = vec3<f32>(-1.0, -1.0, 0.0);
      const G4 = vec3<f32>(1.0, 0.0, 1.0);
      const G5 = vec3<f32>(-1.0, 0.0, 1.0);
      const G6 = vec3<f32>(1.0, 0.0, -1.0);
      const G7 = vec3<f32>(-1.0, 0.0, -1.0);
      const G8 = vec3<f32>(0.0, 1.0, 1.0);
      const G9 = vec3<f32>(0.0, -1.0, 1.0);
      const G10 = vec3<f32>(0.0, 1.0, -1.0);
      const G11 = vec3<f32>(0.0, -1.0, -1.0);

      fn _fnlGradFromHash(h: i32) -> vec3<f32> {
        let idx = u32((h ^ (h >> 15)) & 63);
        // map idx into 12-entry set
        let sel = idx % 12u;
        if (sel == 0u) { return G0; }
        if (sel == 1u) { return G1; }
        if (sel == 2u) { return G2; }
        if (sel == 3u) { return G3; }
        if (sel == 4u) { return G4; }
        if (sel == 5u) { return G5; }
        if (sel == 6u) { return G6; }
        if (sel == 7u) { return G7; }
        if (sel == 8u) { return G8; }
        if (sel == 9u) { return G9; }
        if (sel == 10u) { return G10; }
        return G11;
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

        // Compute hash-like values for each corner and convert to gradient via _fnlGradFromHash
        let n000 = bitcast<i32>(noise(vec4<f32>(f32(X), f32(Y), f32(Z), 0.0))) & 0xff;
        let n001 = bitcast<i32>(noise(vec4<f32>(f32(X), f32(Y), f32((Z + 1) & 255), 0.0))) & 0xff;
        let n010 = bitcast<i32>(noise(vec4<f32>(f32(X), f32((Y + 1) & 255), f32(Z), 0.0))) & 0xff;
        let n011 = bitcast<i32>(noise(vec4<f32>(f32(X), f32((Y + 1) & 255), f32((Z + 1) & 255), 0.0))) & 0xff;
        let n100 = bitcast<i32>(noise(vec4<f32>(f32((X + 1) & 255), f32(Y), f32(Z), 0.0))) & 0xff;
        let n101 = bitcast<i32>(noise(vec4<f32>(f32((X + 1) & 255), f32(Y), f32((Z + 1) & 255), 0.0))) & 0xff;
        let n110 = bitcast<i32>(noise(vec4<f32>(f32((X + 1) & 255), f32((Y + 1) & 255), f32(Z), 0.0))) & 0xff;
        let n111 = bitcast<i32>(noise(vec4<f32>(f32((X + 1) & 255), f32((Y + 1) & 255), f32((Z + 1) & 255), 0.0))) & 0xff;

        let g000 = _fnlGradFromHash(n000);
        let g100 = _fnlGradFromHash(n100);
        let g010 = _fnlGradFromHash(n010);
        let g110 = _fnlGradFromHash(n110);
        let g001 = _fnlGradFromHash(n001);
        let g101 = _fnlGradFromHash(n101);
        let g011 = _fnlGradFromHash(n011);
        let g111 = _fnlGradFromHash(n111);

        // Calculate noise contributions from each of the eight corners (dot products)
        let n000f = dot(g000, vec3<f32>(fx, fy, fz));
        let n001f = dot(g001, vec3<f32>(fx, fy, fz - 1.0));
        let n010f = dot(g010, vec3<f32>(fx, fy - 1.0, fz));
        let n011f = dot(g011, vec3<f32>(fx, fy - 1.0, fz - 1.0));
        let n100f = dot(g100, vec3<f32>(fx - 1.0, fy, fz));
        let n101f = dot(g101, vec3<f32>(fx - 1.0, fy, fz - 1.0));
        let n110f = dot(g110, vec3<f32>(fx - 1.0, fy - 1.0, fz));
        let n111f = dot(g111, vec3<f32>(fx - 1.0, fy - 1.0, fz - 1.0));

        // Compute the fade curve value for fx, fy, fz
        let u = smootherstep(fx);
        let v = smootherstep(fy);
        let w = smootherstep(fz);

        // Interpolate: u inner, w mid, v outer (matches reference implementation)
        let ix0 = lerp(n000f, n100f, u);
        let ix1 = lerp(n010f, n110f, u);
        let iy0 = lerp(ix0, ix1, v);

        let jx0 = lerp(n001f, n101f, u);
        let jx1 = lerp(n011f, n111f, u);
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
