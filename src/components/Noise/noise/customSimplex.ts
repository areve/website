import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const skew2d = (Math.sqrt(3) - 1) / 2;
  const unskew2d = -(3 - Math.sqrt(3)) / 6;
  const noise = makePointGeneratorFast(seed);

  return (coord: Coord, scale: number): number =>
    openSimplex(coord.x / scale, coord.y / scale);

  function openSimplex(ix: number, iy: number): number {
    const skew = (ix + iy) * skew2d;
    const x = Math.floor(ix + skew);
    const y = Math.floor(iy + skew);
    const fx = ix + skew - x;
    const fy = iy + skew - y;

    return (
      vertexContribution(x, y, fx, fy, 0, 0) +
      vertexContribution(x, y, fx, fy, 1, 0) +
      vertexContribution(x, y, fx, fy, 0, 1) +
      vertexContribution(x, y, fx, fy, 1, 1)
    );
  }

  function vertexContribution(
    x: number,
    y: number,
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

    const a = 2 / 3 - dxs * dxs - dys * dys;
    if (a < 0) return 0;

    const h = noise(x + cx, y + cy) * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    return a * a * a * a * (u * dxs + v * dys);
  }
};
