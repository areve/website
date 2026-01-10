export async function setupWorleyRenderer(
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
    label: "worley shader",
    code: /* wgsl */ `
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        // Match the noise function pattern from worley.ts
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }

      fn euclidean(dx: f32, dy: f32, dz: f32) -> f32 {
        return dx * dx + dy * dy + dz * dz;
      }

      fn worley(x: f32, y: f32) -> f32 {
        let scale = data.scale;
        let density = 1.0;
        let dimensions = 3.0;
        
        let ix = x / scale;
        let iy = y / scale;
        let zzx = floor(ix);
        let zzy = floor(iy);
        let fx = ix - zzx;
        let fy = iy - zzy;

        var minDist = 999999.0;

        // Check 4 cell corners: (0,0), (1,0), (0,1), (1,1)
        for (var cy: i32 = 0; cy <= 1; cy++) {
          for (var cx: i32 = 0; cx <= 1; cx++) {
            // Generate points for this cell corner
            for (var i: i32 = 0; i < i32(density); i++) {
              // Match worley.ts: noise(ix + cx, iy + cy, i) * 0xffffff
              let n = noise(vec4f(zzx + f32(cx), zzy + f32(cy), f32(i), 0.0));
              // Convert to integer range [0, 16777215] (0xffffff)
              let h_val = n * 16777215.0;
              let h = u32(floor(h_val));
              
              // Extract bits: (h & 0xff) / 0xff - 0.5
              let px = f32(cx) + (f32(h & 0xffu) / 255.0 - 0.5);
              let py = f32(cy) + (f32((h >> 8u) & 0xffu) / 255.0 - 0.5);
              var pz: f32;
              if (dimensions == 3.0) {
                pz = (f32((h >> 16u) & 0xffu) / 255.0 - 0.5);
              } else {
                pz = 0.0;
              }
              
              let dx = fx - px;
              let dy = fy - py;
              let dz = pz;
              
              let dist = euclidean(dx, dy, dz);
              minDist = min(minDist, dist);
            }
          }
        }

        return sqrt(minDist);
      }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
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
        let normalizedX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let normalizedY = coord.y / data.scale * data.zoom + data.y / data.scale;
        
        // Add time-based offset for animation
        let x = normalizedX + data.z * 0.1;
        let y = normalizedY + data.z * 0.15;
        
        let n = worley(x, y);
        
        // Color based on Worley noise value (matching Noise.vue: hsv2rgb([c, 1 - n ** 0.5, n]))
        let c = fract(data.z / 1000.0);
        let h = c;
        let s = 1.0 - pow(n, 0.5);
        let v = n;
        
        // HSV to RGB conversion
        let h6 = h * 6.0;
        let c_val = v * s;
        let x_val = c_val * (1.0 - abs(fract(h6) * 2.0 - 1.0));
        let m = v - c_val;
        
        var rgb: vec3<f32>;
        if (h6 < 1.0) { rgb = vec3<f32>(c_val, x_val, 0.0); }
        else if (h6 < 2.0) { rgb = vec3<f32>(x_val, c_val, 0.0); }
        else if (h6 < 3.0) { rgb = vec3<f32>(0.0, c_val, x_val); }
        else if (h6 < 4.0) { rgb = vec3<f32>(0.0, x_val, c_val); }
        else if (h6 < 5.0) { rgb = vec3<f32>(x_val, 0.0, c_val); }
        else { rgb = vec3<f32>(c_val, 0.0, x_val); }
        
        return vec4<f32>(rgb + m, 1.0);
      }`,
  });

  const pipeline = device.createRenderPipeline({
    label: "worley pipeline",
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
    label: "worley renderPass",
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
      const encoder = device.createCommandEncoder({ label: "worley encoder" });
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
