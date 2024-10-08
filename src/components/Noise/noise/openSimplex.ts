import { makeNoiseGenerator } from "./prng";

export const makeOpenSimplex2dGenerator = (seed: number, scale: number = 8) => {
  const skew2d = (Math.sqrt(3) - 1) / 2;
  const unskew2d = -(3 - Math.sqrt(3)) / 6;
  const rSquared2d = 2 / 3;
  const noise = makeNoiseGenerator(seed);

  return (x: number, y: number): number => {
    const skew = (x + y) * skew2d;
    const ix = Math.floor(x + skew);
    const iy = Math.floor(y + skew);
    const fx = x + skew - ix;
    const fy = y + skew - iy;

    return (
      vertexContribution(ix, iy, fx, fy, 0, 0) +
      vertexContribution(ix, iy, fx, fy, 1, 0) +
      vertexContribution(ix, iy, fx, fy, 0, 1) +
      vertexContribution(ix, iy, fx, fy, 1, 1) +
      0.5
    );
  };

  function vertexContribution(
    ix: number,
    iy: number,
    fx: number,
    fy: number,
    cx: number,
    cy: number
  ): number {
    const dx = fx - cx;
    const dy = fy - cy;
    const skewedOffset = (dx + dy) * unskew2d;
    const dxs = dx + skewedOffset;
    const dys = dy + skewedOffset;

    const a = rSquared2d - dxs * dxs - dys * dys;
    if (a < 0) return 0;

    const h = noise(ix + cx, iy + cy) * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    return a * a * a * a * (u * dxs + v * dys);
  }
};

export const makeOpenSimplex3dGenerator = (seed: number, scale: number = 8) => {
  const skew3d = 1 / 3;
  const unskew3d = 1 / 6;
  const rSquared3d = 3 / 4;
  const noise = makeNoiseGenerator(seed);

  return (x: number, y: number, z: number): number => {
    const sx = x / scale;
    const sy = y / scale;
    const sz = z / scale;
    const skew = (sx + sy + sz) * skew3d;
    const ix = Math.floor(sx + skew);
    const iy = Math.floor(sy + skew);
    const iz = Math.floor(sz + skew);
    const fx = sx + skew - ix;
    const fy = sy + skew - iy;
    const fz = sz + skew - iz;

    return (
      vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
      vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) +
      0.5
    );
  };

  function vertexContribution(
    ix: number,
    iy: number,
    iz: number,
    fx: number,
    fy: number,
    fz: number,
    cx: number,
    cy: number,
    cz: number
  ): number {
    const dx = fx - cx;
    const dy = fy - cy;
    const dz = fz - cz;
    const skewedOffset = (dx + dy + dz) * unskew3d;
    const dxs = dx - skewedOffset;
    const dys = dy - skewedOffset;
    const dzs = dz - skewedOffset;

    const a = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
    if (a < 0) return 0;

    const h = noise(ix + cx, iy + cy, iz + cz) * 0xfff;
    const u = (h & 0xf) - 8;
    const v = ((h >> 4) & 0xf) - 8;
    const w = ((h >> 8) & 0xf) - 8;
    return (a * a * a * a * (u * dxs + v * dys + w * dzs)) / 2;
  }
};
