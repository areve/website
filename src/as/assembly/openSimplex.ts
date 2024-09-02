// import { makeNoiseGenerator } from "./prng";

import { makeNoiseGenerator, NoiseGenerator } from "./prng";

export type OpenSimplex2dGenerator = (x: f64, y: f64, z: f64) => f64;

let noise!: NoiseGenerator;
let _scale!: f64;

const skew2d: f64 = (Math.sqrt(3) - 1) / 2;
const unskew2d: f64 = -(3 - Math.sqrt(3)) / 6;
const rSquared2d: f64 = 2 / 3;

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
      vertexContribution(ix, iy, fx, fy, 0, 0) +
      vertexContribution(ix, iy, fx, fy, 1, 0) +
      vertexContribution(ix, iy, fx, fy, 0, 1) +
      vertexContribution(ix, iy, fx, fy, 1, 1) +
      0.5
    );
  };

  // };

  // export const makeOpenSimplex3dGenerator = (seed: number, scale: number = 8) => {
  //   const skew3d = 1 / 3;
  //   const unskew3d = 1 / 6;
  //   const rSquared3d = 3 / 4;
  //   const noise = makeNoiseGenerator(seed);

  //   return (x: number, y: number, z: number): number => {
  //     const sx = x / scale;
  //     const sy = y / scale;
  //     const sz = z / scale;
  //     const skew = (sx + sy + sz) * skew3d;
  //     const ix = Math.floor(sx + skew);
  //     const iy = Math.floor(sy + skew);
  //     const iz = Math.floor(sz + skew);
  //     const fx = sx + skew - ix;
  //     const fy = sy + skew - iy;
  //     const fz = sz + skew - iz;

  //     return (
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
  //       vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) +
  //       0.5
  //     );
  //   };

  //   function vertexContribution(
  //     ix: number,
  //     iy: number,
  //     iz: number,
  //     fx: number,
  //     fy: number,
  //     fz: number,
  //     cx: number,
  //     cy: number,
  //     cz: number
  //   ): number {
  //     const dx = fx - cx;
  //     const dy = fy - cy;
  //     const dz = fz - cz;
  //     const skewedOffset = (dx + dy + dz) * unskew3d;
  //     const dxs = dx - skewedOffset;
  //     const dys = dy - skewedOffset;
  //     const dzs = dz - skewedOffset;

  //     const a = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
  //     if (a < 0) return 0;

  //     const h = noise(ix + cx, iy + cy, iz + cz) * 0xfff;
  //     const u = (h & 0xf) - 8;
  //     const v = ((h >> 4) & 0xf) - 8;
  //     const w = ((h >> 8) & 0xf) - 8;
  //     return (a * a * a * a * (u * dxs + v * dys + w * dzs)) / 2;
  //   }
};

function vertexContribution(
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
