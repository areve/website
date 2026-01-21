// OpenSimplex3D helpers (internal symbols use single-underscore _os_ prefix)
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
  let h: i32 = bitcast<i32>(noise(vec4<f32>(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
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
