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
      // Tinting: HSV helper and tint parameters
      const slopeSaturationScale: f32 = 6.0;
      // Scale applied to the angle-derived saturation so tint reacts more strongly
      const angleSaturationScale: f32 = 4.0;
      const tintStrength: f32 = 0.75;
      const PI: f32 = 3.141592653589793;

      fn hsv2rgb(hsv: vec3f) -> vec3f {
        let h = hsv.x;
        let s = hsv.y;
        let v = hsv.z;
        let hue = (((h * 360.0) % 360.0) + 360.0) % 360.0;
        let sector = floor(hue / 60.0);
        let sectorFloat = hue / 60.0 - sector;
        let x = v * (1.0 - s);
        let y = v * (1.0 - s * sectorFloat);
        let z = v * (1.0 - s * (1.0 - sectorFloat));
        let rgb = array<f32, 10>(x, x, z, v, v, y, x, x, z, v);
        return vec3f(rgb[u32(sector) + 4], rgb[u32(sector) + 2], rgb[u32(sector)]);
      }
      // Lighting constants (used for subtle height shading)
      const sunDirConst: vec3f = normalize(vec3f(0.0, 0.0, 1.0));
      const ambientConst: f32 = 0.35;
      const diffuseScale: f32 = 0.65;

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

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // map fragment position to world coordinates used by the noise function
        let x = coord.x / data.scale * data.zoom + data.x / data.scale;
        let y = coord.y / data.scale * data.zoom + data.y / data.scale;

        // Sample height and use centered finite differences for derivatives
        let eps: f32 = 0.25;
        let n = openSimplex3d(x, y, data.z);
        let nxp = openSimplex3d(x + eps, y, data.z);
        let nxm = openSimplex3d(x - eps, y, data.z);
        let nyp = openSimplex3d(x, y + eps, data.z);
        let nym = openSimplex3d(x, y - eps, data.z);
        let derx = (nxp - nxm) / (2.0 * eps);
        let dery = (nyp - nym) / (2.0 * eps);

        // Compute surface normal with Z as the up axis so we can test angle vs Z.
        // normal = (-dz/dx, -dz/dy, 1)
        let normal = normalize(vec3f(-derx, -dery, 1.0));

        // Use the raw height as the base color (white ramp)
        let heightColor = vec3f(n);
        // compute slope magnitude and heading to tint by facing direction
        let slopeMag = length(vec2f(derx, dery));
        let heading: f32 = atan2(derx, dery);
        let hue: f32 = fract(heading / (2.0 * PI) + 1.0);
        // Map saturation from surface angle: flat (normal.z ~= 1.0) -> 0, vertical (normal.z ~= 0.0) -> 1
        // Increase sensitivity so steeper faces get stronger tint.
        let sat: f32 = clamp((1.0 - normal.z) * angleSaturationScale, 0.0, 1.0);
        // Set HSV value (brightness) to the height so valleys are 0 and peaks are 1
        let tintRGB = hsv2rgb(vec3f(hue, sat, n));
        let tintWeight: f32 = sat * tintStrength;
        let lit = heightColor * (1.0 - tintWeight) + tintRGB * tintWeight;


        // Angle test: mark as "flat" when the normal is within 5° of vertical (Z axis)
        // cos(5°) ≈ 0.9961947
        let flatDotThreshold: f32 = 0.9961946981;
        let dotZ = abs(normal.z);
        let isFlatAngle = dotZ > flatDotThreshold;

        // Also consider slope-magnitude based flatness as a fallback (in case angle test misses)
        // tightened slope threshold to avoid mid-slope detections
        let flatSlopeThreshold: f32 = 0.12;
        let isFlatSlope = slopeMag < flatSlopeThreshold;

        // Use midline 0.5: treat >0.5 as peak, <=0.5 as valley, combined with flat test
        let isPeak = (n > 0.5) && (isFlatAngle || isFlatSlope);
        let isValley = (n <= 0.5) && (isFlatAngle || isFlatSlope);

        // Overlay markers: blue for peak, yellow for valley
        var overlay = vec3f(0.0, 0.0, 0.0);
        if (isPeak) {
          overlay = vec3f(0.0, 0.0, 1.0);
        } else if (isValley) {
          overlay = vec3f(1.0, 1.0, 0.0);
        }
        var overlayStrength: f32 = 0.0;
        if (overlay.x + overlay.y + overlay.z > 0.0) {
          overlayStrength = 0.9;
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
