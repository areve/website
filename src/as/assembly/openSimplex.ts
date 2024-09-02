// import { makeNoiseGenerator } from "./prng";

import { makeNoiseGenerator, NoiseGenerator } from "./prng";

export type OpenSimplex2dGenerator = (x: f64, y: f64, z: f64) => f64;
export type OpenSimplex3dGenerator = (x: f64, y: f64, z: f64) => f64;

let noise!: NoiseGenerator;
let _scale!: f64;

const skew2d: f64 = (Math.sqrt(3) - 1) / 2;
const unskew2d: f64 = -(3 - Math.sqrt(3)) / 6;
const rSquared2d: f64 = 2 / 3;

const skew3d: f64 = 1 / 3;
const unskew3d: f64 = 1 / 6;
const rSquared3d: f64 = 3 / 4;

export const makeOpenSimplex2dGenerator = (
  seed: i64,
  scale: f64 = 8
): OpenSimplex2dGenerator => {
  noise = makeNoiseGenerator(seed);
  _scale = scale;

  return (x: f64, y: f64): f64 => {
    const xs: f64 = x / _scale;
    const ys: f64 = y / _scale;
    const skew: f64 = (xs + ys) * skew2d;
    const ix: f64 = Math.floor(xs + skew);
    const iy: f64 = Math.floor(ys + skew);
    const fx: f64 = xs + skew - ix;
    const fy: f64 = ys + skew - iy;

    return (
      vertexContribution2d(ix, iy, fx, fy, 0, 0) +
      vertexContribution2d(ix, iy, fx, fy, 1, 0) +
      vertexContribution2d(ix, iy, fx, fy, 0, 1) +
      vertexContribution2d(ix, iy, fx, fy, 1, 1) +
      0.5
    );
  };
};

function vertexContribution2d(
  ix: f64,
  iy: f64,
  fx: f64,
  fy: f64,
  cx: f64,
  cy: f64
): f64 {
  const dx: f64 = fx - cx;
  const dy: f64 = fy - cy;
  const skewedOffset: f64 = (dx + dy) * unskew2d;
  const dxs: f64 = dx + skewedOffset;
  const dys: f64 = dy + skewedOffset;

  const a: f64 = rSquared2d - dxs * dxs - dys * dys;
  if (a < 0) return 0;

  const h = <u8>(<i64>(noise(ix + cx, iy + cy, 0, 0) * 0xff));
  const u = <f64>(<i64>(<i8>(h & 0xf) - 8));
  const v = <f64>(<i64>(<i8>(h >> 4) - 8));
  return a * a * a * a * (u * dxs + v * dys);
}

export const makeOpenSimplex3dGenerator = (
  seed: i64,
  scale: f64 = 8
): OpenSimplex3dGenerator => {
  noise = makeNoiseGenerator(seed);
  _scale = scale;

  return (x: f64, y: f64, z: f64): f64 => {
    const sx: f64 = x / _scale;
    const sy: f64 = y / _scale;
    const sz: f64 = z / _scale;
    const skew: f64 = (sx + sy + sz) * skew3d;
    const ix: f64 = Math.floor(sx + skew);
    const iy: f64 = Math.floor(sy + skew);
    const iz: f64 = Math.floor(sz + skew);
    const fx: f64 = sx + skew - ix;
    const fy: f64 = sy + skew - iy;
    const fz: f64 = sz + skew - iz;

    return (
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
      vertexContribution3d(ix, iy, iz, fx, fy, fz, 1, 1, 1) +
      0.5
    );
  };
};

function vertexContribution3d(
  ix: f64,
  iy: f64,
  iz: f64,
  fx: f64,
  fy: f64,
  fz: f64,
  cx: f64,
  cy: f64,
  cz: f64
): f64 {
  const dx: f64 = fx - cx;
  const dy: f64 = fy - cy;
  const dz: f64 = fz - cz;
  const skewedOffset: f64 = (dx + dy + dz) * unskew3d;
  const dxs: f64 = dx - skewedOffset;
  const dys: f64 = dy - skewedOffset;
  const dzs: f64 = dz - skewedOffset;

  const a = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
  if (a < 0) return 0;

  // const h = <u8>(<i64>(noise(ix + cx, iy + cy, 0, 0) * 0xff));
  // const u = <f64>(<i64>(<i8>(h & 0xf) - 8));
  // const v = <f64>(<i64>(<i8>(h >> 4) - 8));
  // return a * a * a * a * (u * dxs + v * dys);
  const h = <u8>(<i64>(noise(ix + cx, iy + cy, iz + cz, 0) * 0xfff));
  const u = <f64>(<i64>(<i8>(h & 0xf) - 8));
  const v = <f64>(<i64>(((<i8>(h >> 4)) & 0xf) - 8));
  const w = <f64>(<i64>(((<i8>(h >> 8)) & 0xf) - 8));
  return (a * a * a * a * (u * dxs + v * dys + w * dzs)) / 2;
}
