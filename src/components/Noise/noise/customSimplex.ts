import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  // const noise = makeNoise2D(seed);
  // const foo = new OpenSimplex2S();
  const noise = makePointGeneratorFast(seed);

  const SKEW_2D = (Math.sqrt(3) - 1) / 2;
  const UNSKEW_2D = -(3 - Math.sqrt(3)) / 6;
  const ROOT2OVER2 = Math.sqrt(2) / 2;
  const RSQUARED_2D = 2.0 / 3.0;

  function noise2(x: number, y: number): number {
    // Get points for A2* lattice
    const s = SKEW_2D * (x + y);
    const xs = x + s;
    const ys = y + s;

    return noise2_UnskewedBase(xs, ys);
  }

  function noise2_ImproveX(x: number, y: number): number {
    // Skew transform and rotation baked into one.
    const xx = x * ROOT2OVER2;
    const yy = y * (ROOT2OVER2 * (1 + 2 * SKEW_2D));

    return noise2_UnskewedBase(yy + xx, yy - xx);
  }

  function noise2_UnskewedBase(xs: number, ys: number): number {
    // Get base points and offsets.
    const xsb = fastFloor(xs);
    const ysb = fastFloor(ys);
    const xi = xs - xsb;
    const yi = ys - ysb;

    // Unskew.
    const t = (xi + yi) * UNSKEW_2D;
    const dx0 = xi + t;
    const dy0 = yi + t;

    // First vertex.
    let a0 = RSQUARED_2D - dx0 * dx0 - dy0 * dy0;
    let value = a0 * a0 * (a0 * a0) * grad(xsb, ysb, dx0, dy0);

    // Second vertex.
    let a1 =
      2 * (1 + 2 * UNSKEW_2D) * (1 / UNSKEW_2D + 2) * t +
      (-2 * (1 + 2 * UNSKEW_2D) * (1 + 2 * UNSKEW_2D) + a0);
    let dx1 = dx0 - (1 + 2 * UNSKEW_2D);
    let dy1 = dy0 - (1 + 2 * UNSKEW_2D);
    value += a1 * a1 * (a1 * a1) * grad(xsb + 1, ysb + 1, dx1, dy1);

    // console.log(xs, ys, xi, yi)
    // Third and fourth vertices.
    const xmyi = xi - yi;
    if (t < UNSKEW_2D) {
      if (xi + xmyi > 1) {
        const dx2 = dx0 - (3 * UNSKEW_2D + 2);
        const dy2 = dy0 - (3 * UNSKEW_2D + 1);
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 * a2 * (a2 * a2) * grad(xsb + (1 << 1), ysb + 1, dx2, dy2);
        }
      } else {
        const dx2 = dx0 - UNSKEW_2D;
        const dy2 = dy0 - (UNSKEW_2D + 1);
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value += a2 * a2 * (a2 * a2) * grad(xsb, ysb + 1, dx2, dy2);
        }
      }

      if (yi - xmyi > 1) {
        const dx3 = dx0 - (3 * UNSKEW_2D + 1);
        const dy3 = dy0 - (3 * UNSKEW_2D + 2);
        const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
        if (a3 > 0) {
          value +=
            a3 * a3 * (a3 * a3) * grad(xsb + 1, ysb + (1 << 1), dx3, dy3);
        }
      } else {
        const dx3 = dx0 - (UNSKEW_2D + 1);
        const dy3 = dy0 - UNSKEW_2D;
        const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
        if (a3 > 0) {
          value += a3 * a3 * (a3 * a3) * grad(xsb + 1, ysb, dx3, dy3);
        }
      }
    } else {
      if (xi + xmyi < 0) {
        const dx2 = dx0 + (1 + UNSKEW_2D);
        const dy2 = dy0 + UNSKEW_2D;
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value += a2 * a2 * (a2 * a2) * grad(xsb - 1, ysb, dx2, dy2);
        }
      } else {
        const dx2 = dx0 - (UNSKEW_2D + 1);
        const dy2 = dy0 - UNSKEW_2D;
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value += a2 * a2 * (a2 * a2) * grad(xsb + 1, ysb, dx2, dy2);
        }
      }

      if (yi < xmyi) {
        const dx2 = dx0 + UNSKEW_2D;
        const dy2 = dy0 + (UNSKEW_2D + 1);
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value += a2 * a2 * (a2 * a2) * grad(xsb, ysb - 1, dx2, dy2);
        }
      } else {
        const dx2 = dx0 - UNSKEW_2D;
        const dy2 = dy0 - (UNSKEW_2D + 1);
        const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value += a2 * a2 * (a2 * a2) * grad(xsb, ysb + 1, dx2, dy2);
        }
      }
    }

    return value;
  }

  function grad(xsb: number, ysb: number, x: number, y: number): number {
    const h = (noise(xsb, ysb) * 0xff) & 0xff;
    const u = (h & 0x0f) - 8;
    const v = (h >> 4) - 8;
    return (u * x + v * y) * 0.7071067811865476;
  }

  function fastFloor(x: number): number {
    const xi = x | 0;
    return x < xi ? xi - 1 : xi;
  }

  return (coord: Coord, scale: number): number => {
    return noise2(coord.x / scale, coord.y / scale);
  };
};
