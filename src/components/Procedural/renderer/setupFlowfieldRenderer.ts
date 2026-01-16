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

  // --- GPU-driven particle system ---
  const PARTICLE_COUNT = 400;
  const PARTICLE_SPEED = 5.0;
  const EPS = 0.25;
  const ROTATE_FLOW_90 = 0.0; // 0.0 = false, 1.0 = true (passed to GPU)

  function worldToPixel(wx: number, wy: number) {
    const px = (wx - sharedData.x / sharedData.scale) * sharedData.scale / sharedData.zoom;
    const py = (wy - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
    return [px, py];
  }

  function pixelToWorld(px: number, py: number) {
    const wx = px / sharedData.scale * sharedData.zoom + sharedData.x / sharedData.scale;
    const wy = py / sharedData.scale * sharedData.zoom + sharedData.y / sharedData.scale;
    return [wx, wy];
  }

  // initial particle positions in world space
  const particleArray = new Float32Array(PARTICLE_COUNT * 2);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const sx = Math.random() * options.width;
    const sy = Math.random() * options.height;
    const [wx, wy] = pixelToWorld(sx, sy);
    particleArray[i * 2 + 0] = wx;
    particleArray[i * 2 + 1] = wy;
  }

  const particleBufferSize = particleArray.byteLength;
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  device.queue.writeBuffer(particleBufferA, 0, particleArray.buffer, particleArray.byteOffset, particleArray.byteLength);

  // params buffer for compute (dt, speed, eps, maxStep, rotateFlag)
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();

  // shared WGSL snippets used by both fragment and compute shaders
  const commonWgsl = /* wgsl */ `
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
      let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
      return f32(m) / f32(0xffffffffu);
    }

    const skew3d: f32 = 1.0 / 3.0;
    const unskew3d: f32 = 1.0 / 6.0;
    const rSquared3d: f32 = 3.0 / 4.0;
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

    fn vertexContribution(ix: i32, iy: i32, iz: i32, fx: f32, fy: f32, fz: f32, cx: i32, cy: i32, cz: i32) -> f32 {
      let dx: f32 = fx - f32(cx);
      let dy: f32 = fy - f32(cy);
      let dz: f32 = fz - f32(cz);
      let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
      let dxs: f32 = dx - skewedOffset;
      let dys: f32 = dy - skewedOffset;
      let dzs: f32 = dz - skewedOffset;
      let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
      if (a < 0.0) { return 0.0; }
      let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
      let u: i32 = (h & 0xf) - 8;
      let v: i32 = ((h >> 4) & 0xf) - 8;
      let w: i32 = ((h >> 8) & 0xf) - 8;
      return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
    }

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
        vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
    }
  `;

  const fragmentWgsl = /* wgsl */ `${commonWgsl}

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

      // Return the lit color directly (remove debug peak/trough overlay markers)
      return vec4<f32>(lit, 1.0);
    }
  `;

  const module = device.createShaderModule({ label: "flowfield shader", code: fragmentWgsl });

  // --- Compute shader for GPU particle integration ---
  const computeWgsl = /* wgsl */ `${commonWgsl}

    struct Params { dt: f32, speed: f32, eps: f32, maxStep: f32, rotateFlag: f32 };
    @group(0) @binding(3) var<uniform> params: Params;

    @group(0) @binding(1) var<storage, read> particlesIn: array<vec2<f32>>;
    @group(0) @binding(2) var<storage, read_write> particlesOut: array<vec2<f32>>;

    // helper to compute flow vector at a world position (module-scope)
    // returns the raw flow (negative gradient). Do NOT normalize —
    // this keeps particle speed proportional to slope and avoids
    // numerical jitter when the gradient magnitude is very small.
    fn sampleFlow(wx: f32, wy: f32) -> vec2<f32> {
      let eps_local: f32 = params.eps;
      let n_xp = openSimplex3d(wx + eps_local, wy, data.z);
      let n_xm = openSimplex3d(wx - eps_local, wy, data.z);
      let n_yp = openSimplex3d(wx, wy + eps_local, data.z);
      let n_ym = openSimplex3d(wx, wy - eps_local, data.z);
      var fx = -(n_xp - n_xm) / (2.0 * eps_local);
      var fy = -(n_yp - n_ym) / (2.0 * eps_local);
      if (params.rotateFlag > 0.5) {
        let rx = -fy;
        let ry = fx;
        fx = rx; fy = ry;
      }
      return vec2<f32>(fx, fy);
    }

    @compute @workgroup_size(64)
    fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
      let idx = i32(gid.x);
      if (idx >= ${PARTICLE_COUNT}i) { return; }
      let pos = particlesIn[idx];
      // sample flow at pos (RK2)
      let eps: f32 = params.eps;
      let speed: f32 = params.speed;
      let dt: f32 = params.dt;
      let maxStep: f32 = params.maxStep;

      // integrate using vector RK2: f1 = flow(pos), mid = pos + 0.5*dt*speed*f1,
      // f2 = flow(mid), newPos = pos + dt*speed*f2
      let rawStep = speed * dt;
      let f1 = sampleFlow(pos.x, pos.y);
      let mx = pos.x + f1.x * (rawStep * 0.5);
      let my = pos.y + f1.y * (rawStep * 0.5);
      let f2 = sampleFlow(mx, my);
      var nx = pos.x + f2.x * rawStep;
      var ny = pos.y + f2.y * rawStep;
      // clamp displacement magnitude to avoid overshoot/oscillation
      let disp = vec2<f32>(nx - pos.x, ny - pos.y);
      let dispLen = length(disp);
      if (dispLen > maxStep && dispLen > 1e-6) {
        let scale = maxStep / dispLen;
        nx = pos.x + disp.x * scale;
        ny = pos.y + disp.y * scale;
      }

      // wrap if out of reasonable bounds -> re-seed inside view
      // map to pixel then check
      let px = (nx - data.x / data.scale) * data.scale / data.zoom;
      let py = (ny - data.y / data.scale) * data.scale / data.zoom;
      if (px < -10.0 || py < -10.0 || px > data.width + 10.0 || py > data.height + 10.0) {
        // respawn inside screen in pixel coords
        let sx = f32((idx * 977) % i32(data.width)); // cheap pseudo-random-ish
        let sy = f32(((idx * 1931) / 7) % i32(data.height));
        nx = sx / data.scale * data.zoom + data.x / data.scale;
        ny = sy / data.scale * data.zoom + data.y / data.scale;
      }

      particlesOut[idx] = vec2<f32>(nx, ny);
    }
  `;

  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'cs' } });

  // compute bind groups (created later after `dataBuffer` is available)

  // Particle render pipeline (points)
  // Render each particle as an instanced quad (two triangles) so we can control pixel size.
  // Increase `PARTICLE_PIXEL_SIZE` to make dots larger (user requested ~5x).
  const PARTICLE_PIXEL_SIZE = 5.0;

  const particleWgsl = /* wgsl */ `${commonWgsl}

    @group(0) @binding(1) var<storage, read> particles: array<vec2<f32>>;

    @vertex fn vs(@builtin(vertex_index) vIndex: u32, @builtin(instance_index) iIndex: u32) -> @builtin(position) vec4f {
      // 6 vertices per quad (two triangles)
      let corner = array<vec2f, 6>(
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, 1.0),
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, -1.0)
      );
      let p = particles[iIndex];
      let px = (p.x - data.x / data.scale) * data.scale / data.zoom;
      let ndcx = (px / data.width) * 2.0 - 1.0;
      let py = (p.y - data.y / data.scale) * data.scale / data.zoom;
      let ndcy = -((py / data.height) * 2.0 - 1.0);
      let halfX = f32(${PARTICLE_PIXEL_SIZE}) / data.width;
      let halfY = f32(${PARTICLE_PIXEL_SIZE}) / data.height;
      let pos = vec2f(ndcx + corner[vIndex].x * halfX, ndcy + corner[vIndex].y * halfY);
      return vec4f(pos, 0.0, 1.0);
    }

    @fragment fn fs() -> @location(0) vec4f {
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
  `;

  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particlePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: particleModule, entryPoint: 'vs', buffers: [] },
    fragment: { module: particleModule, entryPoint: 'fs', targets: [{ format: presentationFormat }] },
    primitive: { topology: 'triangle-list' },
  });

  // particle render bind groups will be created after `dataBuffer` is available

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

  // Now create compute and render bind groups that reference the canonical `dataBuffer`
  const computeBindGroupA = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
      { binding: 2, resource: { buffer: particleBufferB } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  const computeBindGroupB = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
      { binding: 2, resource: { buffer: particleBufferA } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  const particleRenderBindA = device.createBindGroup({
    layout: particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
    ],
  });

  const particleRenderBindB = device.createBindGroup({
    layout: particlePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
    ],
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

      // --- GPU particle integration via compute shader ---
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      // write compute params: dt, speed, eps, maxStep, rotateFlag
      const maxStep = EPS * 0.6;
      const paramsArray = new Float32Array([dt, PARTICLE_SPEED, EPS, maxStep, ROTATE_FLOW_90]);
      device.queue.writeBuffer(paramsBuffer, 0, paramsArray.buffer, paramsArray.byteOffset, paramsArray.byteLength);

      // build a single command encoder with compute then render passes
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "compute+render encoder" });

      const cpass = encoder.beginComputePass();
      cpass.setPipeline(computePipeline);
      if (ping) {
        cpass.setBindGroup(0, computeBindGroupA);
      } else {
        cpass.setBindGroup(0, computeBindGroupB);
      }
      const workgroups = Math.ceil(PARTICLE_COUNT / 64);
      cpass.dispatchWorkgroups(workgroups);
      cpass.end();

      // render background then particles
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);

      pass.setPipeline(particlePipeline);
      if (ping) {
        pass.setBindGroup(0, particleRenderBindA);
      } else {
        pass.setBindGroup(0, particleRenderBindB);
      }
      // draw 6 vertices per particle, instanced PARTICLE_COUNT times
      pass.draw(6, PARTICLE_COUNT);
      pass.end();

      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      ping = !ping;
      return device.queue.onSubmittedWorkDone();

      
    },
  };
}
