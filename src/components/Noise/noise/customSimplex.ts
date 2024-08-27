import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const noise = makePointGeneratorFast(seed);

  const skew2d = (Math.sqrt(3) - 1) / 2;
  const unskew2d = -(3 - Math.sqrt(3)) / 6;

  return (coord: Coord, scale: number): number => {
    return noise2(coord.x / scale, coord.y / scale);
  };

  function noise2(ix: number, iy: number): number {
    const skew = (ix + iy) * skew2d;
    const x = fastFloor(ix + skew);
    const y = fastFloor(iy + skew);
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

    const n = noise(x + cx, y + cy)
    // console.log(n)
    const h =  n * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    return a * a * a * a * (u * dxs + v * dys);
  }

  function fastFloor(x: number): number {
    const xi = x | 0;
    return x < xi ? xi - 1 : xi;
  }
};
