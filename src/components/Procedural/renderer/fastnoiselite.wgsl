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

// Helpers
fn permute_vec4(t: vec4f) -> vec4f { return t * ((t * 34.0) + 133.0); }
fn mod_vec3(a: vec3f, b: vec3f) -> vec3f { return a - b * floor(a / b); }
fn mod_vec4(a: vec4f, b: vec4f) -> vec4f { return a - b * floor(a / b); }

// OpenSimplex2 (value-only) - port
fn grad_from_hash(hash: f32) -> vec3f {
  let h = hash;
  var cube = mod_vec3(floor(vec3f(h, h, h) / vec3f(1.0, 2.0, 4.0)), vec3f(2.0)) * 2.0 - vec3f(1.0);
  var cuboct = cube;
  let idx = i32(floor(h / 16.0)) % 3;
  if (idx == 0) { cuboct.x = 0.0; } else if (idx == 1) { cuboct.y = 0.0; } else { cuboct.z = 0.0; }
  let typ = floor(h / 8.0) - floor(h / 16.0) * 2.0;
  let rhomb = (1.0 - typ) * cube + typ * (cuboct + cross(cube, cuboct));
  var g = cuboct * 1.22474487139 + rhomb;
  g = g * ((1.0 - 0.042942436724648037 * typ) * 32.80201376986577);
  return g;
}

fn openSimplex2Base(X: vec3f) -> vec4f {
  let v1 = round(X);
  let d1 = X - v1;
  let score1 = abs(d1);
  let dir1 = step(max(score1.yzx, score1.zxy), score1);
  let v2 = v1 + dir1 * sign(d1);
  let d2 = X - v2;

  let X2 = X + vec3f(144.5, 144.5, 144.5);
  let v3 = round(X2);
  let d3 = X2 - v3;
  let score2 = abs(d3);
  let dir2 = step(max(score2.yzx, score2.zxy), score2);
  let v4 = v3 + dir2 * sign(d3);
  let d4 = X2 - v4;

  var hashes = permute_vec4(mod_vec4(vec4f(v1.x, v2.x, v3.x, v4.x), vec4f(289.0)));
  hashes = permute_vec4(mod_vec4(hashes + vec4f(v1.y, v2.y, v3.y, v4.y), vec4f(289.0)));
  hashes = mod_vec4(permute_vec4(mod_vec4(hashes + vec4f(v1.z, v2.z, v3.z, v4.z), vec4f(289.0))), vec4f(48.0));

  let a = max(vec4f(0.5) - vec4f(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), vec4f(0.0));
  let aa = a * a;
  let aaaa = aa * aa;
  let g1 = grad_from_hash(hashes.x);
  let g2 = grad_from_hash(hashes.y);
  let g3 = grad_from_hash(hashes.z);
  let g4 = grad_from_hash(hashes.w);
  let extrapolations = vec4f(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));

  let value = dot(aaaa, extrapolations);
  return vec4f(0.0, 0.0, 0.0, value);
}

fn openSimplex2_ImproveXY(X: vec3f) -> vec4f {
  let orthonormalMap = mat3x3<f32>(
    vec3f(0.788675134594813, -0.211324865405187, -0.577350269189626),
    vec3f(-0.211324865405187, 0.788675134594813, -0.577350269189626),
    vec3f(0.577350269189626, 0.577350269189626, 0.577350269189626)
  );
  let result = openSimplex2Base(orthonormalMap * X);
  let mapped = vec3f(result.x, result.y, result.z) * orthonormalMap;
  return vec4f(mapped.x, mapped.y, mapped.z, result.w);
}

// OpenSimplex2S (value-only port)
fn grad_from_hash_s(hash: f32) -> vec3f {
  let h = hash;
  var cube = mod_vec3(floor(vec3f(h, h, h) / vec3f(1.0, 2.0, 4.0)), vec3f(2.0)) * 2.0 - vec3f(1.0);
  var cuboct = cube;
  let idx = i32(floor(h / 16.0)) % 3;
  if (idx == 0) { cuboct.x = 0.0; } else if (idx == 1) { cuboct.y = 0.0; } else { cuboct.z = 0.0; }
  let typ = floor(h / 8.0) - floor(h / 16.0) * 2.0;
  let rhomb = (1.0 - typ) * cube + typ * (cuboct + cross(cube, cuboct));
  var g = cuboct * 1.22474487139 + rhomb;
  g = g * ((1.0 - 0.042942436724648037 * typ) * 3.5946317686139184);
  return g;
}

fn openSimplex2SDerivativesPart(X: vec3f) -> vec4f {
  let b = floor(X);
  let i4 = vec4f(X.x - b.x, X.y - b.y, X.z - b.z, 2.5);

  let v1 = b + vec3f(floor(dot(i4, vec4f(.25, .25, .25, .25))));
  let v2 = b + vec3f(1.0, 0.0, 0.0) + vec3f(-1.0, 1.0, 1.0) * vec3f(floor(dot(i4, vec4f(-.25, .25, .25, .35))));
  let v3 = b + vec3f(0.0, 1.0, 0.0) + vec3f(1.0, -1.0, 1.0) * vec3f(floor(dot(i4, vec4f(.25, -.25, .25, .35))));
  let v4 = b + vec3f(0.0, 0.0, 1.0) + vec3f(1.0, 1.0, -1.0) * vec3f(floor(dot(i4, vec4f(.25, .25, -.25, .35))));

  let d1 = X - v1; let d2 = X - v2; let d3 = X - v3; let d4 = X - v4;

  var hashes = permute_vec4(mod_vec4(vec4f(v1.x, v2.x, v3.x, v4.x), vec4f(289.0)));
  hashes = permute_vec4(mod_vec4(hashes + vec4f(v1.y, v2.y, v3.y, v4.y), vec4f(289.0)));
  hashes = mod_vec4(permute_vec4(mod_vec4(hashes + vec4f(v1.z, v2.z, v3.z, v4.z), vec4f(289.0))), vec4f(48.0));

  let a = max(vec4f(0.75) - vec4f(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), vec4f(0.0));
  let aa = a * a; let aaaa = aa * aa;
  let g1 = grad_from_hash_s(hashes.x);
  let g2 = grad_from_hash_s(hashes.y);
  let g3 = grad_from_hash_s(hashes.z);
  let g4 = grad_from_hash_s(hashes.w);
  let extrapolations = vec4f(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
  let value = dot(aaaa, extrapolations);
  return vec4f(0.0, 0.0, 0.0, value);
}

fn openSimplex2SDerivatives_ImproveXY(X: vec3f) -> vec4f {
  let orthonormalMap = mat3x3<f32>(
    vec3f(0.788675134594813, -0.211324865405187, -0.577350269189626),
    vec3f(-0.211324865405187, 0.788675134594813, -0.577350269189626),
    vec3f(0.577350269189626, 0.577350269189626, 0.577350269189626)
  );
  let X2 = orthonormalMap * X;
  let result = openSimplex2SDerivativesPart(X2) + openSimplex2SDerivativesPart(X2 + vec3f(144.5, 144.5, 144.5));
  let mapped = vec3f(result.x, result.y, result.z) * orthonormalMap;
  return vec4f(mapped.x, mapped.y, mapped.z, result.w);
}

// Simple value-noise fallback (fast, hash-based)
fn hash21(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  let a = hash21(i + vec2f(0.0, 0.0));
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0;
}

@vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0) , vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
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

  let t = data.z * 0.001;
  let coords3 = vec3f(x, y, t);

  var n = 0.0;
  if (data.mode < 0.5) {
    n = openSimplex2_ImproveXY(coords3).w;
  } else if (data.mode < 1.5) {
    n = openSimplex2SDerivatives_ImproveXY(coords3).w;
  } else {
    n = valueNoise(vec2f(x, y));
  }

  let v = n * 0.5 + 0.5;
  return vec4f(v, v, v, 1.0);
}
