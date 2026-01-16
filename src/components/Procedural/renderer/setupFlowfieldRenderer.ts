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
  // epsilon used for centered finite-difference sampling of the noise field
  // (used to approximate derivatives / gradient of the noise). Renamed to
  // DERIV_EPS for clarity.
  const DERIV_EPS = 0.25;
  const ROTATE_FLOW_90 = 0.0; // 0.0 = false, 1.0 = true (passed to GPU)
  // Toggle whether the background shader is rendered under the particles.
  // Set to `false` for a plain black background.
  const SHOW_BACKGROUND_SHADER = false;

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

    // ensure we never divide by zero when using data.scale in shaders
    fn safeScale() -> f32 {
      return max(data.scale, 1e-6);
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
      let scl = safeScale();
      let x = coord.x / scl * data.zoom + data.x / scl;
      let y = coord.y / scl * data.zoom + data.y / scl;

      // Sample height and use centered finite differences for derivatives.
      // Rotate the sampling coordinates around the view center by data.rotate
      // so panning works as expected when the field is rotated.
      let eps: f32 = 0.25;
      let cx = data.x / scl + (data.width * 0.5) / scl * data.zoom;
      let cy = data.y / scl + (data.height * 0.5) / scl * data.zoom;
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
      // uniform-random seeding (deterministic per-index via noise)
      let idf = f32(idx);
      let rx = openSimplex3d(idf * 0.618 + data.seed, data.x, data.z);
      let ry = openSimplex3d(idf * 1.357 + data.seed, data.y, data.z);
      var px = clamp(rx, 0.0, 1.0) * data.width;
      var py = clamp(ry, 0.0, 1.0) * data.height;
      // guard against non-finite values
      if (px != px) { px = 0.0; }
      if (py != py) { py = 0.0; }
      let scl = safeScale();
      var nx = px / scl * data.zoom + data.x / scl;
      var ny = py / scl * data.zoom + data.y / scl;
      // stagger initial activation with per-index noise
      let spawnSpread: f32 = 6.0;
      let rand = abs(openSimplex3d(idf * 0.93 + data.seed, idf * 0.31 + data.seed, data.z));
      let delay = rand * spawnSpread;
      let life = -delay;
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
      let dt: f32 = params.dt;
      // Interpret life: positive => remaining life; negative => time-until-activation.
      if (life <= 0.0) {
        // sleeping: count up towards activation
        life = life + dt;
        if (life < 0.0) {
          particlesOut[idx] = vec3<f32>(px0, py0, life);
          return;
        }
        // crossed zero: activate with randomized lifetime
        life = 1.0 + abs(openSimplex3d(f32(idx) * 0.17 + data.x, f32(idx) * 0.29 + data.y, data.z)) * 3.0;
      } else {
        // active particle: decrement life
        life = life - dt;
      }

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
      let scl = safeScale();
      let pixx = (nx - data.x / scl) * scl / data.zoom;
      let pixy = (ny - data.y / scl) * scl / data.zoom;
      var needRespawn = false;
      if (life <= 0.0) { needRespawn = true; }
      if (pixx < -10.0 || pixy < -10.0 || pixx > data.width + 10.0 || pixy > data.height + 10.0) {
        needRespawn = true;
      }

      if (needRespawn) {
        // uniform-random respawn: deterministic per-index noise
        let idf = f32(idx);
        let rx = openSimplex3d(idf * 0.618 + data.seed, data.x, data.z);
        let ry = openSimplex3d(idf * 1.357 + data.seed, data.y, data.z);
        var px = clamp(rx, 0.0, 1.0) * data.width;
        var py = clamp(ry, 0.0, 1.0) * data.height;
        if (px != px) { px = 0.0; }
        if (py != py) { py = 0.0; }
        let scl = safeScale();
        nx = px / scl * data.zoom + data.x / scl;
        ny = py / scl * data.zoom + data.y / scl;
        // keep respawn positions in world coordinates; sampleFlow will handle rotation
        life = 1.0 + abs(openSimplex3d(idf * 0.93 + data.seed, idf * 0.31 + data.seed, data.z)) * 3.0;
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
      @location(1) hueRand: f32,
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
      let scl = safeScale();
      let px = (p.x - data.x / scl) * scl / data.zoom;
      let ndcx = (px / data.width) * 2.0 - 1.0;
      let py = (p.y - data.y / scl) * scl / data.zoom;
      let ndcy = -((py / data.height) * 2.0 - 1.0);
      let halfX = f32(${PARTICLE_PIXEL_SIZE}) / data.width;
      let halfY = f32(${PARTICLE_PIXEL_SIZE}) / data.height;
      let pos = vec2f(ndcx + corner[vIndex].x * halfX, ndcy + corner[vIndex].y * halfY);
      var out: VSOut;
      out.pos = vec4f(pos, 0.0, 1.0);
      out.life = p.z;
      // derive a small per-particle pseudo-random hue from world position/time so
      // dots have subtle color variation without changing buffer layout.
      // scale coords to decorrelate patterns and keep value in [0,1].
      out.hueRand = noise(vec4f(p.x * 12.989, p.y * 78.233, data.z, 0.0));
      return out;
    }
    @fragment fn fs(@location(0) life: f32, @location(1) hueRand: f32) -> @location(0) vec4f {
      // fade particle alpha by remaining life (assume life ~ up to 3.0s for normalization)
      let alpha = 0.30 * clamp(life / 3.0, 0.0, 1.0);
      // small hue tint blended toward a saturated color so variation is subtle
      let jitterAmt: f32 = 0.4;
      let hue = fract(hueRand) * 0.6 + 0.75;
      let tint = hsv2rgb(vec3f(hue, 0.8, 1.0));
      let base = vec3f(1.0, 1.0, 1.0);
      let col = base * (1.0 - jitterAmt) + tint * jitterAmt;
      return vec4f(col, alpha);
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

  const api = {
    async init() {
      // ensure uniforms are initialized before running the GPU init so data.scale/etc are valid
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
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
      await device.queue.onSubmittedWorkDone();

      // copy seeded A->B so both buffers contain a useful initial state
      try {
        const encCopy = device.createCommandEncoder();
        encCopy.copyBufferToBuffer(particleBufferA, 0, particleBufferB, 0, particleBufferSize);
        device.queue.submit([encCopy.finish()]);
        await device.queue.onSubmittedWorkDone();
      } catch (e) {
        console.warn('seed copy A->B failed', e);
      }

      // robust debug helper: read back seed distribution and report non-finite samples
      async function debugSeedStatsFor(buf: GPUBuffer, name: string) {
        try {
          console.log(`debugSeedStats: sharedData.scale=${sharedData.scale}, width=${sharedData.width}, height=${sharedData.height}`);
          const read = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
          const enc = device.createCommandEncoder();
          enc.copyBufferToBuffer(buf, 0, read, 0, particleBufferSize);
          device.queue.submit([enc.finish()]);
          await read.mapAsync(GPUMapMode.READ);
          const data = new Float32Array(read.getMappedRange().slice(0));
          let minY = Number.POSITIVE_INFINITY;
          let maxY = Number.NEGATIVE_INFINITY;
          let sum = 0;
          let firstNonFiniteIndex = -1;
          const samples: number[] = [];
          let bottomCount = 0;
          for (let i = 0; i < data.length; i += 3) {
            const worldY = data[i + 1];
            samples.push(worldY);
            if (!Number.isFinite(worldY) && firstNonFiniteIndex === -1) firstNonFiniteIndex = i / 3;
            const pixY = (worldY - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            if (Number.isFinite(pixY)) {
              minY = Math.min(minY, pixY);
              maxY = Math.max(maxY, pixY);
              sum += pixY;
              if (pixY >= sharedData.height * 0.75) bottomCount++;
            }
          }
          const avg = sum / (data.length / 3);
          const bottomPct = (bottomCount / (data.length / 3)) * 100.0;
          // compute how many seeds are visible in the current view and how many are in the bottom quarter
          let visibleCount = 0;
          let visibleBottom = 0;
          for (let i = 0; i < data.length; i += 3) {
            const worldY = data[i + 1];
            const pixY = (worldY - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            if (Number.isFinite(pixY) && pixY >= 0 && pixY <= sharedData.height) {
              visibleCount++;
              if (pixY >= sharedData.height * 0.75) visibleBottom++;
            }
          }
          const visiblePct = (visibleCount / (data.length / 3)) * 100.0;
          const bottomPctVisible = visibleCount > 0 ? (visibleBottom / visibleCount) * 100.0 : 0.0;
          // compute 10 histogram buckets across the canvas height to see vertical distribution
          const buckets = new Array<number>(10).fill(0);
          for (let i = 0; i < data.length; i += 3) {
            const worldY = data[i + 1];
            const pixY = (worldY - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            if (!Number.isFinite(pixY)) continue;
            const t = Math.max(0, Math.min(sharedData.height, pixY));
            const b = Math.floor((t / sharedData.height) * buckets.length);
            buckets[Math.min(buckets.length - 1, b)]++;
          }
          const bucketPct = buckets.map(c => ((c / (data.length / 3)) * 100.0).toFixed(1));
          console.log(`Seed stats (${name}): minY=${isFinite(minY) ? minY.toFixed(2) : 'NaN'}, maxY=${isFinite(maxY) ? maxY.toFixed(2) : 'NaN'}, avgY=${isFinite(avg) ? avg.toFixed(2) : 'NaN'}, bottom25%=${bottomPct.toFixed(1)}%, visible%=${visiblePct.toFixed(1)}%, bottomOfVisible%=${bottomPctVisible.toFixed(1)}%, buckets%=[${bucketPct.join(', ')}]`);
          if (firstNonFiniteIndex >= 0) {
            console.warn(`Found non-finite worldY at particle index ${firstNonFiniteIndex}. Sample values:`, samples.slice(firstNonFiniteIndex, firstNonFiniteIndex + 6));
          }
          if (isFinite(maxY) && maxY < sharedData.height * 0.98) {
            console.warn(`Coverage: seeds do not reach bottom edge (maxY=${maxY.toFixed(2)} < height*0.98=${(sharedData.height*0.98).toFixed(2)})`);
          }
          read.unmap();
          read.destroy?.();
          return { minY, maxY, avg };
        } catch (e) {
          console.warn('debugSeedStats failed', e);
          return null;
        }
      }
      // expose a helper for quick debugging from the host
      (this as any).debugSeedStats = async () => {
        await debugSeedStatsFor(particleBufferA, 'A');
        await debugSeedStatsFor(particleBufferB, 'B');
      };

      // reveal seeds immediately (useful for debugging visual coverage)
      (this as any).revealSeeds = async () => {
        try {
          const read = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
          const enc = device.createCommandEncoder();
          enc.copyBufferToBuffer(particleBufferA, 0, read, 0, particleBufferSize);
          device.queue.submit([enc.finish()]);
          await read.mapAsync(GPUMapMode.READ);
          const data = new Float32Array(read.getMappedRange().slice(0));
          // ensure positive life values for immediate visibility
          for (let i = 0; i < data.length; i += 3) {
            // x=data[i], y=data[i+1], life=data[i+2]
            data[i + 2] = Math.max(0.5, Math.abs(data[i + 2]));
          }
          // write back to both buffers so next frame shows particles regardless of ping
          device.queue.writeBuffer(particleBufferA, 0, data.buffer, data.byteOffset, data.byteLength);
          device.queue.writeBuffer(particleBufferB, 0, data.buffer, data.byteOffset, data.byteLength);
          read.unmap();
          read.destroy?.();
          console.log('revealSeeds: activated particles for immediate visibility');
        } catch (e) {
          console.warn('revealSeeds failed', e);
        }
      };

      // draw an on-screen overlay (DOM canvas) showing seed pixel positions for visual debugging
      (this as any).showSeedOverlay = async (opts?: { clear?: boolean }) => {
        const id = 'flowfield-seed-overlay';
        let overlay = document.getElementById(id) as HTMLCanvasElement | null;
        // Always update the overlay size/position to match the canvas at draw time
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if (!overlay) {
          overlay = document.createElement('canvas');
          overlay.id = id;
          overlay.style.position = 'fixed';
          overlay.style.pointerEvents = 'none';
          document.body.appendChild(overlay);
        }
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        // set backing store size in device pixels so drawn points align perfectly
        overlay.width = Math.max(1, Math.round(rect.width * dpr));
        overlay.height = Math.max(1, Math.round(rect.height * dpr));

        const ctx = overlay.getContext('2d')!;
        if (opts?.clear) { ctx.clearRect(0, 0, overlay.width, overlay.height); return; }
        // read particle positions and draw
        try {
          const read = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
          const enc = device.createCommandEncoder();
          enc.copyBufferToBuffer(particleBufferA, 0, read, 0, particleBufferSize);
          device.queue.submit([enc.finish()]);
          await read.mapAsync(GPUMapMode.READ);
          const data = new Float32Array(read.getMappedRange().slice(0));
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          // account for CSS/device pixel scaling between canvas internal buffer and displayed size
          const scaleX = overlay.width / canvas.width;
          const scaleY = overlay.height / canvas.height;
          // draw a faint bottom-25% guide
          ctx.strokeStyle = 'rgba(0,255,0,0.6)';
          ctx.lineWidth = Math.max(1, Math.round(1 * dpr));
          const bottomY = Math.round(overlay.height * 0.75);
          ctx.beginPath(); ctx.moveTo(0, bottomY); ctx.lineTo(overlay.width, bottomY); ctx.stroke();
          ctx.fillStyle = 'rgba(255,0,0,0.9)';
          for (let i = 0; i < data.length; i += 3) {
            const worldX = data[i + 0];
            const worldY = data[i + 1];
            const px = (worldX - sharedData.x / sharedData.scale) * sharedData.scale / sharedData.zoom;
            const py = (worldY - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
            const drawX = Math.round(px * scaleX);
            const drawY = Math.round(py * scaleY);
            // draw small rect for visibility (scale size for DPR)
            const size = Math.max(1, Math.round(2 * dpr));
            ctx.fillRect(drawX - Math.floor(size/2), drawY - Math.floor(size/2), size, size);
          }
          read.unmap();
          read.destroy?.();
          console.log('showSeedOverlay: drawn (fixed positioning + DPR-aware scaling)');
        } catch (e) {
          console.warn('showSeedOverlay failed', e);
        }
      };

      // call debug automatically so a log appears in the console after init
      (this as any).debugSeedStats();

      // helper: force uniform seeds across the visible canvas for testing/debugging
      (this as any).forceUniformSeeds = async () => {
        try {
          const out = new Float32Array(particleBufferSize / 4);
          const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT));
          const rows = Math.ceil(PARTICLE_COUNT / cols);
          let ptr = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (ptr >= PARTICLE_COUNT) break;
              const u = c / Math.max(1, cols - 1);
              const v = r / Math.max(1, rows - 1);
              const sx = u * sharedData.width;
              const sy = v * sharedData.height;
              // add small random jitter
              const jx = (Math.random() - 0.5) * (sharedData.width / cols) * 0.45;
              const jy = (Math.random() - 0.5) * (sharedData.height / rows) * 0.45;
              const px = Math.min(sharedData.width, Math.max(0, sx + jx));
              const py = Math.min(sharedData.height, Math.max(0, sy + jy));
              const scl = Math.max(1e-6, sharedData.scale);
              const nx = px / scl * sharedData.zoom + sharedData.x / scl;
              const ny = py / scl * sharedData.zoom + sharedData.y / scl;
              // life positive so visible
              out[ptr * 3 + 0] = nx;
              out[ptr * 3 + 1] = ny;
              out[ptr * 3 + 2] = 2.0;
              ptr++;
            }
          }
          // write to both buffers
          device.queue.writeBuffer(particleBufferA, 0, out.buffer, out.byteOffset, ptr * 3 * 4);
          device.queue.writeBuffer(particleBufferB, 0, out.buffer, out.byteOffset, ptr * 3 * 4);
          console.log('forceUniformSeeds: wrote', ptr, 'particles');
        } catch (e) {
          console.warn('forceUniformSeeds failed', e);
        }
      };

      // helper: dump a few seed samples (pixel coords) to aid diagnosis
      (this as any).dumpSeedSamples = async (count = 10) => {
        try {
          const read = device.createBuffer({ size: particleBufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
          const enc = device.createCommandEncoder();
          enc.copyBufferToBuffer(particleBufferA, 0, read, 0, particleBufferSize);
          device.queue.submit([enc.finish()]);
          await read.mapAsync(GPUMapMode.READ);
          const data = new Float32Array(read.getMappedRange().slice(0));
          const samples: Array<{i:number, px:number, py:number, life:number}> = [];
          for (let i = 0; i < Math.min(count, PARTICLE_COUNT); i++) {
            const wx = data[i*3+0];
            const wy = data[i*3+1];
            const life = data[i*3+2];
            const px_correct = (wx - sharedData.x / sharedData.scale) * sharedData.scale / sharedData.zoom;
            const py_correct = (wy - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            const px_swapped = (wx - sharedData.y / sharedData.scale) * sharedData.scale / sharedData.zoom;
            const py_swapped = (wy - sharedData.x / sharedData.scale) * sharedData.scale / sharedData.zoom;
            samples.push({i, px_correct, py_correct, px_swapped, py_swapped, life});
          }
          console.log('seed samples:', samples.slice(0, count));
          read.unmap();
          read.destroy?.();
        } catch (e) {
          console.warn('dumpSeedSamples failed', e);
        }
      };

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
      const maxStep = DERIV_EPS * 0.6;
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
      const paramsArray = new Float32Array([dt, PARTICLE_SPEED, DERIV_EPS, maxStep, rotateState]);
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
      if (SHOW_BACKGROUND_SHADER) {
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
      }
      // when SHOW_BACKGROUND_SHADER is false we simply clear the bgTexture to black
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

      
    }
  };
  (window as any).flowfieldRenderer = api;
  return api;
}
