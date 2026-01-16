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
    rotate: 0.0,
    asBuffer() {
      // pad to vec4 boundaries so WGSL uniform layout matches expectation
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        this.rotate,
        0.0,
        0.0,
        0.0,
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
  const PARTICLE_COUNT = 5000;
  const PARTICLE_SPEED = 2.5;
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

  const particleBufferSize = PARTICLE_COUNT * 3 * 4; // 3 floats per particle (x,y,life)
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });

  // params buffer for compute (dt, speed, eps, maxStep, rotateFlag)
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  let ping = true; // ping-pong flag
  let lastFrameTime = performance.now();
  let rotateState = 0.0;

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
      zoom: f32,
      rotate: f32,
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

      // Sample height and use centered finite differences for derivatives.
      // Rotate the sampling coordinates around the view center by data.rotate
      // so panning works as expected when the field is rotated.
      let eps: f32 = 0.25;
      let cx = data.x / data.scale + (data.width * 0.5) / data.scale * data.zoom;
      let cy = data.y / data.scale + (data.height * 0.5) / data.scale * data.zoom;
      let theta = data.rotate;
      let c = cos(theta);
      let s = sin(theta);
      // rotate sampling coords by -theta (R^T)
      let rx = (x - cx) * c + (y - cy) * s + cx;
      let ry = -(x - cx) * s + (y - cy) * c + cy;

      let n = openSimplex3d(rx, ry, data.z);
      let nxp = openSimplex3d(rx + eps, ry, data.z);
      let nxm = openSimplex3d(rx - eps, ry, data.z);
      let nyp = openSimplex3d(rx, ry + eps, data.z);
      let nym = openSimplex3d(rx, ry - eps, data.z);
      let derx_r = (nxp - nxm) / (2.0 * eps);
      let dery_r = (nyp - nym) / (2.0 * eps);
      // rotate derivatives back into world coordinates using R
      let derx = derx_r * c - dery_r * s;
      let dery = derx_r * s + dery_r * c;

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

    struct Params { dt: f32, speed: f32, eps: f32, maxStep: f32, rotateAngle: f32 };
    @group(0) @binding(3) var<uniform> params: Params;

    @group(0) @binding(1) var<storage, read> particlesIn: array<vec3<f32>>;
    @group(0) @binding(2) var<storage, read_write> particlesOut: array<vec3<f32>>;

    // helper to compute flow vector at a world position (module-scope)
    // returns the raw flow (negative gradient). Do NOT normalize —
    // this keeps particle speed proportional to slope and avoids
    // numerical jitter when the gradient magnitude is very small.
    fn sampleFlow(wx: f32, wy: f32) -> vec2<f32> {
      let eps_local: f32 = params.eps;
      // rotate sampling coordinates around view center so the field rotates
      // consistently with the fragment background and panning remains intuitive
      let cx = data.x / data.scale + (data.width * 0.5) / data.scale * data.zoom;
      let cy = data.y / data.scale + (data.height * 0.5) / data.scale * data.zoom;
      let theta = params.rotateAngle;
      let c = cos(theta);
      let s = sin(theta);
      // rotate sampling coords by -theta (R^T)
      let rx = (wx - cx) * c + (wy - cy) * s + cx;
      let ry = -(wx - cx) * s + (wy - cy) * c + cy;

      let n_xp = openSimplex3d(rx + eps_local, ry, data.z);
      let n_xm = openSimplex3d(rx - eps_local, ry, data.z);
      let n_yp = openSimplex3d(rx, ry + eps_local, data.z);
      let n_ym = openSimplex3d(rx, ry - eps_local, data.z);
      var fx_r = -(n_xp - n_xm) / (2.0 * eps_local);
      var fy_r = -(n_yp - n_ym) / (2.0 * eps_local);
      // rotate gradient back into world coordinates using R
      let fx = fx_r * c - fy_r * s;
      let fy = fx_r * s + fy_r * c;
      return vec2<f32>(fx, fy);
    }

    @compute @workgroup_size(64)
    fn init(@builtin(global_invocation_id) gid: vec3<u32>) {
      let idx = i32(gid.x);
      if (idx >= ${PARTICLE_COUNT}i) { return; }
      // grid-based seeding that includes edges: map col/row to [0,width] and [0,height]
      var cols = i32(floor(sqrt(f32(${PARTICLE_COUNT}))));
      if (cols < 1) { cols = 1; }
      let rows = i32(ceil(f32(${PARTICLE_COUNT}) / f32(cols)));
      let col = idx % cols;
      let row = idx / cols;
      let denomCols = f32(max(cols - 1, 1));
      let denomRows = f32(max(rows - 1, 1));
      var u: f32;
      var v: f32;
      if (cols > 1) {
        u = f32(col) / denomCols;
      } else {
        u = 0.5;
      }
      if (rows > 1) {
        v = f32(row) / denomRows;
      } else {
        v = 0.5;
      }
      let sx = u * data.width;
      let sy = v * data.height;
      // jitter up to roughly half a cell so particles can appear near edges
      let cellW = data.width / f32(cols);
      let cellH = data.height / f32(rows);
      let jitterX = cellW * 0.5;
      let jitterY = cellH * 0.5;
      let jx = (openSimplex3d(f32(col) * 0.21 + data.x, f32(row) * 0.37 + data.y, data.z) - 0.5) * jitterX;
      let jy = (openSimplex3d(f32(col) * 0.53 + data.x, f32(row) * 0.79 + data.y, data.z) - 0.5) * jitterY;
      var px = sx + jx;
      var py = sy + jy;
      // clamp into view so jitter doesn't push particles off-canvas
      px = clamp(px, 0.0, data.width);
      py = clamp(py, 0.0, data.height);
      var nx = px / data.scale * data.zoom + data.x / data.scale;
      var ny = py / data.scale * data.zoom + data.y / data.scale;
      // rotate initial world position into the rotated sampling frame so seeds align with rotated field
      // keep seed positions in world coordinates; sampling rotation is handled in sampleFlow/fragment
      // lifetime in seconds (randomized by noise)
      let life = 1.0 + abs(openSimplex3d(f32(col) * 0.93 + data.x, f32(row) * 0.31 + data.y, data.z)) * 3.0;
      particlesOut[idx] = vec3<f32>(nx, ny, life);
    }

    @compute @workgroup_size(64)
    fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
      let idx = i32(gid.x);
      if (idx >= ${PARTICLE_COUNT}i) { return; }
      let p = particlesIn[idx];
      var px0 = p.x;
      var py0 = p.y;
      var life = p.z;
      // decrement life
      let dt: f32 = params.dt;
      life = life - dt;

      // sample flow at pos (RK2)
      let eps: f32 = params.eps;
      let speed: f32 = params.speed;
      let maxStep: f32 = params.maxStep;
      let rawStep = speed * dt;
      let f1 = sampleFlow(px0, py0);
      let mx = px0 + f1.x * (rawStep * 0.5);
      let my = py0 + f1.y * (rawStep * 0.5);
      let f2 = sampleFlow(mx, my);
      var nx = px0 + f2.x * rawStep;
      var ny = py0 + f2.y * rawStep;
      // clamp displacement magnitude to avoid overshoot/oscillation
      let disp = vec2<f32>(nx - px0, ny - py0);
      let dispLen = length(disp);
      if (dispLen > maxStep && dispLen > 1e-6) {
        let scale = maxStep / dispLen;
        nx = px0 + disp.x * scale;
        ny = py0 + disp.y * scale;
      }

      // map to pixel then check bounds
      let pixx = (nx - data.x / data.scale) * data.scale / data.zoom;
      let pixy = (ny - data.y / data.scale) * data.scale / data.zoom;
      var needRespawn = false;
      if (life <= 0.0) { needRespawn = true; }
      if (pixx < -10.0 || pixy < -10.0 || pixx > data.width + 10.0 || pixy > data.height + 10.0) {
        needRespawn = true;
      }

      if (needRespawn) {
        // respawn on the grid with jitter so particles appear across the whole view including edges
        var cols = i32(floor(sqrt(f32(${PARTICLE_COUNT}))));
        if (cols < 1) { cols = 1; }
        let rows = i32(ceil(f32(${PARTICLE_COUNT}) / f32(cols)));
        let col = idx % cols;
        let row = idx / cols;
        let denomCols = f32(max(cols - 1, 1));
        let denomRows = f32(max(rows - 1, 1));
        var u: f32;
        var v: f32;
        if (cols > 1) { u = f32(col) / denomCols; } else { u = 0.5; }
        if (rows > 1) { v = f32(row) / denomRows; } else { v = 0.5; }
        let sx = u * data.width;
        let sy = v * data.height;
        let cellW = data.width / f32(cols);
        let cellH = data.height / f32(rows);
        let jitterX = cellW * 0.5;
        let jitterY = cellH * 0.5;
        let jx = (openSimplex3d(f32(col) * 0.21 + data.x, f32(row) * 0.37 + data.y, data.z) - 0.5) * jitterX;
        let jy = (openSimplex3d(f32(col) * 0.53 + data.x, f32(row) * 0.79 + data.y, data.z) - 0.5) * jitterY;
        var px = sx + jx;
        var py = sy + jy;
        px = clamp(px, 0.0, data.width);
        py = clamp(py, 0.0, data.height);
        nx = px / data.scale * data.zoom + data.x / data.scale;
        ny = py / data.scale * data.zoom + data.y / data.scale;
        // keep respawn positions in world coordinates; sampleFlow will handle rotation
        life = 1.0 + abs(openSimplex3d(f32(col) * 0.93 + data.x, f32(row) * 0.31 + data.y, data.z)) * 3.0;
      }

      particlesOut[idx] = vec3<f32>(nx, ny, life);
    }
  `;

  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'cs' } });
  const computeInitPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'init' } });

  // compute bind groups (created later after `dataBuffer` is available)

  // Particle render pipeline (points)
  // Render each particle as an instanced quad (two triangles) so we can control pixel size.
  // Increase `PARTICLE_PIXEL_SIZE` to make dots larger (user requested ~5x).
  const PARTICLE_PIXEL_SIZE = 5.0;

  const particleWgsl = /* wgsl */ `${commonWgsl}

    @group(0) @binding(1) var<storage, read> particles: array<vec3<f32>>;

    struct VSOut {
      @builtin(position) pos: vec4f,
      @location(0) life: f32,
    };

    @vertex fn vs(@builtin(vertex_index) vIndex: u32, @builtin(instance_index) iIndex: u32) -> VSOut {
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
      var out: VSOut;
      out.pos = vec4f(pos, 0.0, 1.0);
      out.life = p.z;
      return out;
    }
    @fragment fn fs(@location(0) life: f32) -> @location(0) vec4f {
      // fade particle alpha by remaining life (assume life ~ up to 3.0s for normalization)
      let alpha = 0.30 * clamp(life / 3.0, 0.0, 1.0);
      return vec4f(1.0, 1.0, 1.0, alpha);
    }
  `;

  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particlePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: particleModule, entryPoint: 'vs', buffers: [] },
    fragment: { module: particleModule, entryPoint: 'fs', targets: [{ format: presentationFormat, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
    primitive: { topology: 'triangle-list' },
    multisample: { count: 1 },
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

  // --- accumulation textures for particle trails (ping-pong) ---
  const accTextureA = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });
  const accTextureB = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });

  // offscreen background texture so composite shader can sample both bg and accumulation
  const bgTexture = device.createTexture({
    size: { width: options.width, height: options.height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  });

  const linearSampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });

  // clear accTextureA to black initially
  {
    const enc = device.createCommandEncoder();
    const rpd: GPURenderPassDescriptor = { colorAttachments: [{ view: accTextureA.createView(), clearValue: [0,0,0,0], loadOp: 'clear', storeOp: 'store' }] };
    const rp = enc.beginRenderPass(rpd);
    rp.end();
    device.queue.submit([enc.finish()]);
  }

  // clear bgTexture to black initially
  {
    const enc = device.createCommandEncoder();
    const rpd: GPURenderPassDescriptor = { colorAttachments: [{ view: bgTexture.createView(), clearValue: [0,0,0,1], loadOp: 'clear', storeOp: 'store' }] };
    const rp = enc.beginRenderPass(rpd);
    rp.end();
    device.queue.submit([enc.finish()]);
  }

  // fade pass shader: samples previous accumulation and multiplies by fade factor
  const accFadeWgsl = /* wgsl */ `${commonWgsl}
    @group(0) @binding(1) var samp: sampler;
    @group(0) @binding(2) var prevTex: texture_2d<f32>;

    @vertex fn vs2(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment fn fs2(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
      let uv = coord.xy / vec2f(data.width, data.height);
      let prev = textureSample(prevTex, samp, uv);
      // Separate fade for color vs alpha:
      // - color (RGB) fades slower so bright highlights persist longer
      // - alpha fades faster so the darker lingering trail becomes more transparent
      let fadeRGB = 0.995;
      let fadeA = 0.92;
      return vec4f(prev.xyz * fadeRGB, prev.w * fadeA);
    }
  `;

  const accFadeModule = device.createShaderModule({ code: accFadeWgsl });
  const accFadePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: accFadeModule, entryPoint: 'vs2' },
    fragment: { module: accFadeModule, entryPoint: 'fs2', targets: [{ format: presentationFormat }] },
    primitive: { topology: 'triangle-list' },
  });

  // composite pipeline: draw accumulation texture over swapchain (alpha blend)
  // composite shader: sample background and accumulation, multiply them and output to swapchain
  const compositeWgsl = /* wgsl */ `${commonWgsl}
    @group(0) @binding(1) var samp2: sampler;
    @group(0) @binding(2) var bgTex: texture_2d<f32>;
    @group(0) @binding(3) var accTex: texture_2d<f32>;
    @vertex fn vs3(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }
    @fragment fn fs3(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
      let uv = coord.xy / vec2f(data.width, data.height);
      let bg = textureSample(bgTex, samp2, uv);
      let acc = textureSample(accTex, samp2, uv);
      // Screen blend (Photoshop 'Screen'):
      // out = 1 - (1 - bg) * (1 - src)
      // use accumulation color modulated by its alpha as the source strength
      let src = acc.rgb * acc.a;
      let one = vec3f(1.0, 1.0, 1.0);
      let outRgb = one - (one - bg.rgb) * (one - src);
      return vec4f(outRgb, 1.0);
    }
  `;

  const compositeModule = device.createShaderModule({ code: compositeWgsl });
  const compositePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: compositeModule, entryPoint: 'vs3' },
    fragment: { module: compositeModule, entryPoint: 'fs3', targets: [{ format: presentationFormat }] },
    primitive: { topology: 'triangle-list' },
  });

  // bind groups for accumulation sampling/composite (we'll select correct views per frame)
  // Note: `accFadeWgsl` and `compositeWgsl` don't reference `data` in their fragment entry points,
  // so the pipeline reflection may omit binding 0. Create bind groups with only sampler (1) and texture (2).
  let accBindA = device.createBindGroup({ layout: accFadePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: accTextureA.createView() } ] });
  let accBindB = device.createBindGroup({ layout: accFadePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: accTextureB.createView() } ] });
  let compositeBindA = device.createBindGroup({ layout: compositePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: bgTexture.createView() }, { binding: 3, resource: accTextureA.createView() } ] });
  let compositeBindB = device.createBindGroup({ layout: compositePipeline.getBindGroupLayout(0), entries: [ { binding: 0, resource: { buffer: dataBuffer } }, { binding: 1, resource: linearSampler }, { binding: 2, resource: bgTexture.createView() }, { binding: 3, resource: accTextureB.createView() } ] });

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

  // create an init bind group matching the computeInitPipeline's layout
  // The 'init' entry in the compute shader only references binding 0 (data) and binding 2 (particlesOut),
  // so create the bind group with only those entries to match pipeline reflection.
  const computeInitBindGroup = device.createBindGroup({
    layout: computeInitPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 2, resource: { buffer: particleBufferA } },
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
    async init() {
      // seed particles on the GPU once at startup
      const encoder = device.createCommandEncoder();
      const cpass = encoder.beginComputePass();
      cpass.setPipeline(computeInitPipeline);
      // write into particleBufferA via the init bind group
      cpass.setBindGroup(0, computeInitBindGroup);
      const workgroups = Math.ceil(PARTICLE_COUNT / 64);
      cpass.dispatchWorkgroups(workgroups);
      cpass.end();
      device.queue.submit([encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
        rotate?: boolean | number;
        rotation?: number;
      }
    ) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.0005;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      // --- GPU particle integration via compute shader ---
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      // write compute params: dt, speed, eps, maxStep, rotateAngle
      const maxStep = EPS * 0.6;
      // accept either numeric `rotation` (radians) or boolean `rotate` (90deg toggle)
      if (data && typeof (data as any).rotation === 'number') {
        rotateState = (data as any).rotation;
      } else if (data && typeof (data as any).rotate !== 'undefined') {
        rotateState = (data as any).rotate ? Math.PI / 2.0 : 0.0;
      }
      // ensure the uniform shared data exposes the same rotate value for fragment shaders
      sharedData.rotate = rotateState;
      // write sharedData again so fragment pipelines/readers see the updated rotation this frame
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      const paramsArray = new Float32Array([dt, PARTICLE_SPEED, EPS, maxStep, rotateState]);
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
      // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
      // choose which acc textures are src/dst based on accPing
      const accSrcView = ping ? accTextureA.createView() : accTextureB.createView();
      const accDstView = ping ? accTextureB.createView() : accTextureA.createView();

      const accPassDesc: GPURenderPassDescriptor = { colorAttachments: [{ view: accDstView, clearValue: [0,0,0,0], loadOp: 'clear', storeOp: 'store' }] };
      const accPass = encoder.beginRenderPass(accPassDesc);
      // fade previous accumulation into dst
      if (ping) {
        accPass.setPipeline(accFadePipeline);
        accPass.setBindGroup(0, accBindA);
      } else {
        accPass.setPipeline(accFadePipeline);
        accPass.setBindGroup(0, accBindB);
      }
      accPass.draw(6);
      // draw particles additively (semi-transparent) onto accumulation
      accPass.setPipeline(particlePipeline);
      if (ping) {
        accPass.setBindGroup(0, particleRenderBindA);
      } else {
        accPass.setBindGroup(0, particleRenderBindB);
      }
      accPass.draw(6, PARTICLE_COUNT);
      accPass.end();

      // render background into offscreen bgTexture (so composite shader can sample it)
      const bgView = bgTexture.createView();
      renderPassDescriptor.colorAttachments[0].view = bgView;
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();

      // composite accumulation onto swapchain (sample bgTexture + accumulation and write multiplied result)
      const swapView = context.getCurrentTexture().createView();
      const compDesc: GPURenderPassDescriptor = { colorAttachments: [{ view: swapView, loadOp: 'clear', storeOp: 'store', clearValue: [0,0,0,1] }] };
      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      // composite should sample the bgTexture and the newly-written accumulation (dst)
      if (ping) {
        compPass.setBindGroup(0, compositeBindB);
      } else {
        compPass.setBindGroup(0, compositeBindA);
      }
      compPass.draw(6);
      compPass.end();

      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      ping = !ping;
      return device.queue.onSubmittedWorkDone();

      
    },
  };
}
