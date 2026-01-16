export async function setupFlowfieldRenderer(
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
    scale: options.scale ?? 100,
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
    label: "flowfield shader",
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
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;
      // Lighting constants for sun shading
      const sunDirConst: vec3f = normalize(vec3f(0.6, 0.8, 0.2));
      const ambientConst: f32 = 0.0; // remove ambient so lighting and shadows are clearer
      const slopeScale: f32 = 20.0; // amplify gradient magnitude for lighting influence

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
        let sx: f32 = x;
        let sy: f32 = y;
        let sz: f32 = z;
        let skew: f32 = (sx + sy + sz) * skew3d;
        let ix: i32 = i32(floor(sx + skew));
        let iy: i32 = i32(floor(sy + skew));
        let iz: i32 = i32(floor(sz + skew));
        let fx: f32 = sx + skew - f32(ix);
        let fy: f32 = sy + skew - f32(iy);
        let fz: f32 = sz + skew - f32(iz);

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }

      fn vertexContribution(
        ix: i32, iy: i32, iz: i32,
        fx: f32, fy: f32, fz: f32,
        cx: i32, cy: i32, cz: i32
      ) -> f32 {
        let dx: f32 = fx - f32(cx);
        let dy: f32 = fy - f32(cy);
        let dz: f32 = fz - f32(cz);
        let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
        let dxs: f32 = dx - skewedOffset;
        let dys: f32 = dy - skewedOffset;
        let dzs: f32 = dz - skewedOffset;

        let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
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

      // (no HSV mapping; we'll render lighting only)

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map pixel -> world coordinates using same transform as other renderers
        let x = coord.x / data.scale * data.zoom + data.x / data.scale;
        let y = coord.y / data.scale * data.zoom + data.y / data.scale;

        // Sample height and finite-difference neighbors
        let n = openSimplex3d(x, y, data.z);
        let eps: f32 = 0.25; // smaller step for finer gradient
        let nx = openSimplex3d(x + eps, y, data.z);
        let ny = openSimplex3d(x, y + eps, data.z);
        let dx = nx - n;
        let dy = ny - n;
        // convert to derivative (per unit) so slopeScale behaves predictably
        let derx = dx / eps;
        let dery = dy / eps;

        // Compute approximate surface normal from height field: (-dz/dx, 1, -dz/dy)
        let normal = normalize(vec3f(-derx, 1.0, -dery));
        // For this view we remove shadows and focus on height + markers.
        // Compute simple slope magnitude for use in flat detection only.
        let rawSlope = length(vec2f(derx, dery));
        let slopeMag = clamp(rawSlope * slopeScale, 0.0, 1.0);
        // Use the raw height as the base color (white ramp) and ignore sun shadows
        let heightColor = vec3f(n);
        let lit = heightColor; // no shading

        // Detect flat local extrema (peaks/valleys) and overlay colored dots
        // Increase flat threshold to make dots larger and more tolerant
        let flatThreshold: f32 = 0.18;
        let isFlat = rawSlope < flatThreshold;
        // Use 3-sample extrema detection (nx, left, up) as requested — cheaper and sufficient.
        let n_left = openSimplex3d(x - eps, y, data.z);
        let n_up = openSimplex3d(x, y - eps, data.z);
        // average of the three neighbor samples (excluding center)
        let avgNeighbors = (nx + n_left + n_up) / 3.0;
        // require small contrast and midline check so peaks are truly bright and valleys truly dark
        let contrast: f32 = 0.01;
        let peakMidline: f32 = 0.55;
        let valleyMidline: f32 = 0.45;
        let isPeak = isFlat && (n > avgNeighbors) && ((n - avgNeighbors) > contrast) && (n > peakMidline);
        let isValley = isFlat && (n < avgNeighbors) && ((avgNeighbors - n) > contrast) && (n < valleyMidline);

        var overlay = vec3f(0.0);
        if (isFlat && isPeak) {
          overlay = vec3f(0.0, 0.0, 1.0); // peak => blue (swapped)
        } else if (isFlat && isValley) {
          overlay = vec3f(1.0, 1.0, 0.0); // valley => yellow (swapped)
        }

        // Blend overlay if present (slightly less than full to keep context)
        var overlayStrength: f32 = 0.0;
        if (overlay.x + overlay.y + overlay.z > 0.0) {
          overlayStrength = 0.75;
        }
        let out = lit * (1.0 - overlayStrength) + overlay * overlayStrength;
        return vec4<f32>(out, 1.0);
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
      sharedData.z = time * 0.0001;
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
