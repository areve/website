struct Params { dt: f32, speed: f32, eps: f32, maxStep: f32 };
@group(0) @binding(3) var<uniform> params: Params;

@group(0) @binding(1) var<storage, read> particlesIn: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<vec3<f32>>;

// helper to compute flow vector at a world position (module-scope)
// returns the raw flow (negative gradient). Do NOT normalize —
// this keeps particle speed proportional to slope and avoids
// numerical jitter when the gradient magnitude is very small.
fn sampleFlow(wx: f32, wy: f32) -> vec2<f32> {
  // Sample the noise field directly at world coords (no rotation/pan transform).
  // Returns the negative gradient (flow) in world-space.
  let eps_local: f32 = params.eps;
  let n_xp = openSimplex3d(wx + eps_local, wy, data.z);
  let n_xm = openSimplex3d(wx - eps_local, wy, data.z);
  let n_yp = openSimplex3d(wx, wy + eps_local, data.z);
  let n_ym = openSimplex3d(wx, wy - eps_local, data.z);
  let fx = -(n_xp - n_xm) / (2.0 * eps_local);
  let fy = -(n_yp - n_ym) / (2.0 * eps_local);
  return vec2<f32>(fx, fy);
}

@compute @workgroup_size(64)
fn init(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = i32(gid.x);
  if (idx >= ${particleCount}i) { return; }
  // uniform-random seeding (deterministic per-index via noise)
  let idf = f32(idx);
  // use uniform noise (previously openSimplex) to get unbiased per-index u/v in [0,1]
  let rx = noise(vec4f(idf * 0.618, idf * 1.731, f32(data.seed), 0.0));
  let ry = noise(vec4f(idf * 1.357, idf * 0.271, f32(data.seed), 1.0));
  var px = rx * data.width;
  var py = ry * data.height;
  // guard against non-finite values
  if (px != px) { px = 0.0; }
  if (py != py) { py = 0.0; }
  // rotate pixel coords by data.rotation around the pixel center so spawn area
  // matches the rotated background sampling
  let theta = data.rotation;
  let c = cos(theta);
  let s = sin(theta);
  let relPx = px - data.width * 0.5;
  let relPy = py - data.height * 0.5;
  let rpx = relPx * c - relPy * s + data.width * 0.5;
  let rpy = relPx * s + relPy * c + data.height * 0.5;
  // map initial random pixel to world coordinates using data.scale
  var nx = rpx / data.scale * data.zoom + data.x / data.scale;
  var ny = rpy / data.scale * data.zoom + data.y / data.scale;
  // stagger initial activation with per-index noise
  let spawnSpread: f32 = 6.0;
  let rand = noise(vec4f(idf * 0.93, idf * 0.31, f32(data.seed), 2.0));
  let delay = rand * spawnSpread;
  let life = -delay;
  particlesOut[idx] = vec3<f32>(nx, ny, life);
}

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = i32(gid.x);
  if (idx >= ${particleCount}i) { return; }
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

  // map to pixel then check bounds (inverse of world-from-pixel mapping)
  let pixx = (nx * data.scale - data.x) / data.zoom;
  let pixy = (ny * data.scale - data.y) / data.zoom;
  var needRespawn = false;
  if (life <= 0.0) { needRespawn = true; }
  if (pixx < -10.0 || pixy < -10.0 || pixx > data.width + 10.0 || pixy > data.height + 10.0) {
    needRespawn = true;
  }

  if (needRespawn) {
    // uniform-random respawn: deterministic per-index noise
    let idf = f32(idx);
    let rx = noise(vec4f(idf * 0.618, idf * 1.731, f32(data.seed), 0.0));
    let ry = noise(vec4f(idf * 1.357, idf * 0.271, f32(data.seed), 1.0));
    var px = rx * data.width;
    var py = ry * data.height;
    if (px != px) { px = 0.0; }
    if (py != py) { py = 0.0; }
    // rotate respawn pixel coords by data.rotation around the pixel center
    let theta = data.rotation;
    let c = cos(theta);
    let s = sin(theta);
    let relPx = px - data.width * 0.5;
    let relPy = py - data.height * 0.5;
    let rpx = relPx * c - relPy * s + data.width * 0.5;
    let rpy = relPx * s + relPy * c + data.height * 0.5;
    // map respawn pixel to world coords using data.scale
    nx = rpx / data.scale * data.zoom + data.x / data.scale;
    ny = rpy / data.scale * data.zoom + data.y / data.scale;
    // keep respawn positions in world coordinates; sampleFlow will handle rotation
    life = 1.0 + noise(vec4f(idf * 0.93, idf * 0.31, f32(data.seed), 2.0)) * 3.0;
  }

  particlesOut[idx] = vec3<f32>(nx, ny, life);
}
