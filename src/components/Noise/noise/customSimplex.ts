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
    const xsb = safeFloor(xs);
    const ysb = safeFloor(ys);
    const xi = xs - xsb;
    const yi = ys - ysb;

    return (
      vertexContribution(xsb, ysb, xi, yi) +
      vertexContribution(xsb + 1, ysb + 1, xi - 1, yi - 1) +
      vertexContribution(xsb + 1, ysb, xi - 1, yi) +
      vertexContribution(xsb, ysb + 1, xi, yi - 1)
    );
  }

  function vertexContribution(
    xsb: number,
    ysb: number,
    dx: number,
    dy: number
  ): number {
    const skew = (dx + dy) * UNSKEW_2D;
    const dxs = dx + skew;
    const dys = dy + skew;

    const a = 2 / 3 - dxs * dxs - dys * dys;
    if (a < 0) return 0;

    const h = noise(xsb, ysb) * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    const g = u * dxs + v * dys;
    return a * a * a * a * g;
  }

  function safeFloor(x: number): number {
    const xi = x | 0;
    return x < xi ? xi - 1 : xi;
  }
};
