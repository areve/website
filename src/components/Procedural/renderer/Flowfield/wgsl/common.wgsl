// common WGSL helpers for Procedural renderers

// integer-hash-based noise (quantized coords) - returns [0,1]
fn noise(coord: vec4<f32>) -> f32 {
  let q: u32 = u32(floor(coord.x * 4096.0));
  let r: u32 = u32(floor(coord.y * 4096.0));
  let s: u32 = u32(floor(coord.z * 4096.0));
  let t: u32 = u32(floor(coord.w * 4096.0));
  let n: u32 = data.seed + q * 374761393u + r * 668265263u + s * 1440662683u + t * 3865785317u;
  let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
  return f32(m) * (1.0 / 4294967295.0);
}

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

struct Uniforms {
  width: f32,
  height: f32,
  seed: u32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  rotation: f32,
};

@group(0) @binding(0) var<uniform> data: Uniforms;

const PI: f32 = 3.141592653589793;
const angleSaturationScale: f32 = 4.0;
const tintStrength: f32 = 0.75;

// safe scale (avoid divide-by-zero)
fn safeScale() -> f32 { return max(data.scale, 1e-6); }

// convert integer pixel coords -> normalized uv
fn uvFromPixel(p: vec2f) -> vec2f { return p / vec2f(data.width, data.height); }
// uv in [-0.5,0.5] centered and corrected for zoom
fn centeredUVFromPixel(p: vec2f) -> vec2f { return (uvFromPixel(p) - vec2f(0.5, 0.5)) / data.zoom; }
// small helpers to encode visual mapping logic
fn angleToSaturation(a: f32) -> f32 { return clamp(abs(a) * angleSaturationScale, 0.0, 1.0); }
fn tintColor(rgb: vec3f) -> vec3f { return rgb * tintStrength; }

// OpenSimplex3D helpers (internal symbols use single-underscore `_os_` prefix)
const _os_skew3d: f32 = 1.0 / 3.0;
const _os_unskew3d: f32 = 1.0 / 6.0;
const _os_rSquared3d: f32 = 3.0 / 4.0;
fn _os_vertexContribution(ix: i32, iy: i32, iz: i32, fx: f32, fy: f32, fz: f32, cx: i32, cy: i32, cz: i32) -> f32 {
  let dx: f32 = fx - f32(cx);
  let dy: f32 = fy - f32(cy);
  let dz: f32 = fz - f32(cz);
  let skewedOffset: f32 = (dx + dy + dz) * _os_unskew3d;
  let dxs: f32 = dx - skewedOffset;
  let dys: f32 = dy - skewedOffset;
  let dzs: f32 = dz - skewedOffset;
  let a: f32 = _os_rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
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
  let skew: f32 = (sx + sy + sz) * _os_skew3d;
  let ix: i32 = i32(floor(sx + skew));
  let iy: i32 = i32(floor(sy + skew));
  let iz: i32 = i32(floor(sz + skew));
  let fx: f32 = sx + skew - f32(ix);
  let fy: f32 = sy + skew - f32(iy);
  let fz: f32 = sz + skew - f32(iz);
  return 0.5 +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
}
