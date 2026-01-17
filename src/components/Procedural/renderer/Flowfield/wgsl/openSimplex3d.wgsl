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
