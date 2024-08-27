import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const noise = makePointGeneratorFast(seed);

  const SKEW_2D = (Math.sqrt(3) - 1) / 2;
  const UNSKEW_2D = -(3 - Math.sqrt(3)) / 6;

  return (coord: Coord, scale: number): number => {
    return noise2(coord.x / scale, coord.y / scale);
  };

  function noise2(x: number, y: number): number {
    const skew = (x + y) * SKEW_2D;
    const xs = x + skew;
    const ys = y + skew;
    const xsb = fastFloor(xs);
    const ysb = fastFloor(ys);
    const xi = xs - xsb;
    const yi = ys - ysb;

    return (
      vertexContribution(xsb, ysb, xi, yi, 0, 0) +
      vertexContribution(xsb, ysb, xi, yi, 1, 1) +
      vertexContribution(xsb, ysb, xi, yi, 1, 0) +
      vertexContribution(xsb, ysb, xi, yi, 0, 1)
    );
  }

  function vertexContribution(
    xsb: number,
    ysb: number,
    xi: number,
    yi: number,
    cx: number,
    cy: number
  ): number {
    const dx = xi - cx;
    const dy = yi - cy;
    const skew = (dx + dy) * UNSKEW_2D;
    const dxs = dx + skew;
    const dys = dy + skew;

    const a = 2 / 3 - dxs * dxs - dys * dys;
    if (a < 0) return 0;

    const h = noise(xsb + cx, ysb + cy) * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    const g = u * dxs + v * dys;
    return a * a * a * a * g;
  }

  function fastFloor(x: number): number {
    const xi = x | 0;
    return x < xi ? xi - 1 : xi;
  }
};
