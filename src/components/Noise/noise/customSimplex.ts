import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  // const noise = makeNoise2D(seed);
  // const foo = new OpenSimplex2S();
  const noise = makePointGeneratorFast(seed);

  const SKEW_2D = (Math.sqrt(3) - 1) / 2;
  const UNSKEW_2D = -(3 - Math.sqrt(3)) / 6;

  return (coord: Coord, scale: number): number => {
    return noise2(coord.x / scale, coord.y / scale);
  };

  function noise2(x: number, y: number): number {
    // Get points for A2* lattice
    const skew = (x + y) * SKEW_2D;
    const xs = x + skew;
    const ys = y + skew;

    return noise2_UnskewedBase(xs, ys);
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

    let value = 0;

    // top left vertex
    value += calculateVertex(xsb, ysb, dx0, dy0);

    // bottom right vertex
    value += calculateVertex(
      xsb + 1,
      ysb + 1,
      dx0 - (1 + 2 * UNSKEW_2D),
      dy0 - (1 + 2 * UNSKEW_2D)
    );

    // Third and fourth vertices.
    const isBottomRight = t < UNSKEW_2D;
    if (isBottomRight) {
      const isRightThird = xi + (xi - yi) > 1;
      if (isRightThird) {
        value += calculateVertex(
          xsb,
          ysb + 1,
          dx0 - (3 * UNSKEW_2D + 2),
          dy0 - (3 * UNSKEW_2D + 1)
        );
      } else {
        value += calculateVertex(
          xsb,
          ysb + 1,
          dx0 - UNSKEW_2D,
          dy0 - (UNSKEW_2D + 1)
        );
      }

      const isBottomThird = yi - (xi - yi) > 1;
      if (isBottomThird) {
        value += calculateVertex(
          xsb + 1,
          ysb,
          dx0 - (3 * UNSKEW_2D + 1),
          dy0 - (3 * UNSKEW_2D + 2)
        );
      } else {
        value += calculateVertex(
          xsb + 1,
          ysb,
          dx0 - (UNSKEW_2D + 1),
          dy0 - UNSKEW_2D
        );
      }
    } else {
      const isLeftThird = xi + (xi - yi) < 0;
      if (isLeftThird) {
        value += calculateVertex(
          xsb - 1,
          ysb,
          dx0 + (UNSKEW_2D + 1),
          dy0 + UNSKEW_2D
        );
      } else {
        value += calculateVertex(
          xsb + 1,
          ysb,
          dx0 - (UNSKEW_2D + 1),
          dy0 - UNSKEW_2D
        );
      }

      const isTopThird = yi < xi - yi;
      if (isTopThird) {
        value += calculateVertex(
          xsb,
          ysb - 1,
          dx0 + UNSKEW_2D,
          dy0 + (UNSKEW_2D + 1)
        );
      } else {
        value += calculateVertex(
          xsb,
          ysb + 1,
          dx0 - UNSKEW_2D,
          dy0 - (UNSKEW_2D + 1)
        );
      }
    }

    return value;
  }

  function calculateVertex(
    xsb: number,
    ysb: number,
    dx: number,
    dy: number
  ): number {
    const a = 2 / 3 - dx * dx - dy * dy;
    return a > 0 //
      ? a * a * a * a * grad(xsb, ysb, dx, dy)
      : 0;
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
};
