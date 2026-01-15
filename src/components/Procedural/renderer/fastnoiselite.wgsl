struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  rotation: f32,
  mode: f32,
};

@group(0) @binding(0) var<uniform> data: Uniforms;

// Integer primes (copied from C)
const PRIME_X: i32 = 501125321;
const PRIME_Y: i32 = 1136930381;
const PRIME_Z: i32 = 1720413743;

// Small helpers
fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + t * (b - a); }
fn interpQuintic(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
fn interpHermite(t: f32) -> f32 { return t * t * (3.0 - 2.0 * t); }

// Simple integer hash (2D)
fn hash2d(seed: i32, xPrimed: i32, yPrimed: i32) -> i32 {
  var h = seed ^ xPrimed ^ yPrimed;
  h = h * 0x27d4eb2d;
  return h;
}

// Convert integer hash to a pseudo-random float in [0,1)
fn hash_to_unit(h: i32) -> f32 {
  // use bit-mangling then normalize
  var x = f32(h);
  return fract(sin(x) * 43758.5453123);
}

// Procedural gradient from hash (2D)
fn grad2_from_hash(h: i32) -> vec2<f32> {
  let u = hash_to_unit(h);
  let angle = u * 6.283185307179586;
  return vec2<f32>(cos(angle), sin(angle));
}

// Value coordinate from integer grid
fn val_coord2d(seed: i32, xPrimed: i32, yPrimed: i32) -> f32 {
  var h = hash2d(seed, xPrimed, yPrimed);
  h = h * h;
  h = h ^ (h << 19);
  return f32(h) * (1.0 / 2147483648.0);
}

// Gradient dot product for 2D
fn grad_coord2d(seed: i32, xPrimed: i32, yPrimed: i32, xd: f32, yd: f32) -> f32 {
  var h = hash2d(seed, xPrimed, yPrimed);
  h = h ^ (h >> 15);
  let g = grad2_from_hash(h);
  return xd * g.x + yd * g.y;
}

// Simplex-like 2D (approximation of OpenSimplex2)
fn single_simplex2d(seed: i32, x: f32, y: f32) -> f32 {
  let SQRT3 = 1.7320508075688772;
  let G2 = (3.0 - SQRT3) / 6.0;

  var i = i32(floor(x));
  var j = i32(floor(y));
  let xi = x - f32(i);
  let yi = y - f32(j);

  let t = (xi + yi) * G2;
  let x0 = xi - t;
  let y0 = yi - t;

  var i0 = i * PRIME_X;
  var j0 = j * PRIME_Y;

  var n0 = 0.0;
  var a = 0.5 - x0 * x0 - y0 * y0;
  if (a > 0.0) {
    let aa = a * a;
    n0 = aa * aa * grad_coord2d(seed, i0, j0, x0, y0);
  }

  // other corners
  var x1: f32; var y1: f32; var n1: f32 = 0.0;
  var x2: f32; var y2: f32; var n2: f32 = 0.0;

  if (y0 > x0) {
    x1 = x0 + G2; y1 = y0 + (G2 - 1.0);
    let b = 0.5 - x1 * x1 - y1 * y1;
    if (b > 0.0) { let bb = b * b; n1 = bb * bb * grad_coord2d(seed, i0, j0 + PRIME_Y, x1, y1); }

    x2 = x0 + (2.0 * G2 - 1.0); y2 = y0 + (2.0 * G2 - 1.0);
    let c = (2.0 * (1.0 - 2.0 * G2) * (1.0 / G2 - 2.0)) * t + ((-2.0 * (1.0 - 2.0 * G2) * (1.0 - 2.0 * G2)) + a);
    if (c > 0.0) { let cc = c * c; n2 = cc * cc * grad_coord2d(seed, i0 + PRIME_X, j0 + PRIME_Y, x2, y2); }
  } else {
    x1 = x0 + (G2 - 1.0); y1 = y0 + G2;
    let b = 0.5 - x1 * x1 - y1 * y1;
    if (b > 0.0) { let bb = b * b; n1 = bb * bb * grad_coord2d(seed, i0 + PRIME_X, j0, x1, y1); }

    x2 = x0 + (2.0 * G2 - 1.0); y2 = y0 + (2.0 * G2 - 1.0);
    let c = (2.0 * (1.0 - 2.0 * G2) * (1.0 / G2 - 2.0)) * t + ((-2.0 * (1.0 - 2.0 * G2) * (1.0 - 2.0 * G2)) + a);
    if (c > 0.0) { let cc = c * c; n2 = cc * cc * grad_coord2d(seed, i0 + PRIME_X, j0 + PRIME_Y, x2, y2); }
  }

  return (n0 + n1 + n2) * 99.836854;
}

// Simple OpenSimplex2S approximation: use two offset simplex calls
fn single_open_simplex2s2d(seed: i32, x: f32, y: f32) -> f32 {
  let v1 = single_simplex2d(seed, x, y);
  let v2 = single_simplex2d(seed + 1293373, x + 0.5, y + 0.5);
  return (v1 + v2) * 0.5;
}

// Value noise (cubic omitted; using bilinear interp)
fn single_value2d(seed: i32, x: f32, y: f32) -> f32 {
  let x0 = i32(floor(x));
  let y0 = i32(floor(y));
  let xs = interpHermite(x - f32(x0));
  let ys = interpHermite(y - f32(y0));

  let v00 = val_coord2d(seed, x0 * PRIME_X, y0 * PRIME_Y);
  let v10 = val_coord2d(seed, (x0 + 1) * PRIME_X, y0 * PRIME_Y);
  let v01 = val_coord2d(seed, x0 * PRIME_X, (y0 + 1) * PRIME_Y);
  let v11 = val_coord2d(seed, (x0 + 1) * PRIME_X, (y0 + 1) * PRIME_Y);

  let ix0 = lerp(v00, v10, xs);
  let ix1 = lerp(v01, v11, xs);
  return lerp(ix0, ix1, ys) * 2.0 - 1.0;
}

@vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  let pos = array<vec2<f32>, 6>(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0), vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, -1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let centerX = (data.width * 0.5) / data.scale * data.zoom + data.x / data.scale;
  let centerY = (data.height * 0.5) / data.scale * data.zoom + data.y / data.scale;
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

  let t = data.z * 0.001;

  let seed = i32(data.seed);
  var n: f32 = 0.0;
  if (data.mode < 0.5) {
    n = single_simplex2d(seed, x, y);
  } else if (data.mode < 1.5) {
    n = single_open_simplex2s2d(seed, x, y);
  } else {
    n = single_value2d(seed, x, y);
  }

  let v = n * 0.5 + 0.5;
  return vec4<f32>(v, v, v, 1.0);
}
