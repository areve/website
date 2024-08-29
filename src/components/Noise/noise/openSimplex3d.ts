import { Coord3d } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeOpenSimplex3dGenerator = (seed: number, scale: number = 8) => {
  const skew3d = 1 / 3;
  const unskew3d = 1 / 6;
  const noise = makePointGeneratorFast(seed);

  return (coord: Coord3d): number =>
    openSimplex(coord.x / scale, coord.y / scale, coord.z / scale);

  function openSimplex(ix: number, iy: number, iz: number): number {
    const skew = (ix + iy + iz) * skew3d;
    const x = Math.floor(ix + skew);
    const y = Math.floor(iy + skew);
    const z = Math.floor(iz + skew);
    const fx = ix + skew - x;
    const fy = iy + skew - y;
    const fz = iz + skew - z;

    const r =
      vertexContribution(x, y, z, fx, fy, fz, 0, 0, 0) +
      vertexContribution(x, y, z, fx, fy, fz, 1, 0, 0) +
      vertexContribution(x, y, z, fx, fy, fz, 0, 1, 0) +
      vertexContribution(x, y, z, fx, fy, fz, 1, 1, 0) +
      vertexContribution(x, y, z, fx, fy, fz, 0, 0, 1) +
      vertexContribution(x, y, z, fx, fy, fz, 1, 0, 1) +
      vertexContribution(x, y, z, fx, fy, fz, 0, 1, 1) +
      vertexContribution(x, y, z, fx, fy, fz, 1, 1, 1);
    0;
    return r * 0.5 + 0.5; // 0.5 was trial and error
  }

  function vertexContribution(
    x: number,
    y: number,
    z: number,
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

    const rSquared3d = 3 / 4;
    const a = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
    if (a < 0) return 0;

    const h = noise(x + cx, y + cy, z + cz) * 0xfff;
    const u = (h & 0xf) - 8;
    const v = ((h >> 4) & 0xf) - 8;
    const w = ((h >> 8) & 0xf) - 8;
    return a * a * a * a * (u * dxs + v * dys + w * dzs);
  }
};
