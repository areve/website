import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  // const noise = makeNoise2D(seed);
  // const foo = new OpenSimplex2S();
  const noise = makePointGeneratorFast(seed);

  return (coord: Coord, scale: number): number => {
    const seed = noise(coord.x, coord.y);
    return OpenSimplex2S.noise2(1234, coord.x / scale, coord.y / scale);
  };
};

class OpenSimplex2S {
  private static readonly PRIME_X = 15918337;
  private static readonly PRIME_Y = 98954231;
  private static readonly HASH_MULTIPLIER = 59308303;
  private static readonly SKEW_2D = 0.366025403784439;
  private static readonly UNSKEW_2D = -0.21132486540518713;
  private static readonly ROOT2OVER2 = 0.7071067811865476;
  private static readonly RSQUARED_2D = 2.0 / 3.0;

  public static noise2(seed: number, x: number, y: number): number {
    // Get points for A2* lattice
    const s = OpenSimplex2S.SKEW_2D * (x + y);
    const xs = x + s;
    const ys = y + s;

    return OpenSimplex2S.noise2_UnskewedBase(seed, xs, ys);
  }

  public static noise2_ImproveX(seed: number, x: number, y: number): number {
    // Skew transform and rotation baked into one.
    const xx = x * OpenSimplex2S.ROOT2OVER2;
    const yy = y * (OpenSimplex2S.ROOT2OVER2 * (1 + 2 * OpenSimplex2S.SKEW_2D));

    return OpenSimplex2S.noise2_UnskewedBase(seed, yy + xx, yy - xx);
  }

  private static noise2_UnskewedBase(
    seed: number,
    xs: number,
    ys: number
  ): number {
    // Get base points and offsets.
    const xsb = OpenSimplex2S.fastFloor(xs);
    const ysb = OpenSimplex2S.fastFloor(ys);
    const xi = xs - xsb;
    const yi = ys - ysb;

    // Prime pre-multiplication for hash.
    const xsbp = xsb * OpenSimplex2S.PRIME_X;
    const ysbp = ysb * OpenSimplex2S.PRIME_Y;

    // Unskew.
    const t = (xi + yi) * OpenSimplex2S.UNSKEW_2D;
    const dx0 = xi + t;
    const dy0 = yi + t;

    // First vertex.
    let a0 = OpenSimplex2S.RSQUARED_2D - dx0 * dx0 - dy0 * dy0;
    let value =
      a0 * a0 * (a0 * a0) * OpenSimplex2S.grad(seed, xsbp, ysbp, dx0, dy0);

    // Second vertex.
    let a1 =
      2 *
        (1 + 2 * OpenSimplex2S.UNSKEW_2D) *
        (1 / OpenSimplex2S.UNSKEW_2D + 2) *
        t +
      (-2 *
        (1 + 2 * OpenSimplex2S.UNSKEW_2D) *
        (1 + 2 * OpenSimplex2S.UNSKEW_2D) +
        a0);
    let dx1 = dx0 - (1 + 2 * OpenSimplex2S.UNSKEW_2D);
    let dy1 = dy0 - (1 + 2 * OpenSimplex2S.UNSKEW_2D);
    value +=
      a1 *
      a1 *
      (a1 * a1) *
      OpenSimplex2S.grad(
        seed,
        xsbp + OpenSimplex2S.PRIME_X,
        ysbp + OpenSimplex2S.PRIME_Y,
        dx1,
        dy1
      );

    // console.log(xs, ys, xi, yi)
    // Third and fourth vertices.
    const xmyi = xi - yi;
    if (t < OpenSimplex2S.UNSKEW_2D) {
      if (xi + xmyi > 1) {
        const dx2 = dx0 - (3 * OpenSimplex2S.UNSKEW_2D + 2);
        const dy2 = dy0 - (3 * OpenSimplex2S.UNSKEW_2D + 1);
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp + (OpenSimplex2S.PRIME_X << 1),
              ysbp + OpenSimplex2S.PRIME_Y,
              dx2,
              dy2
            );
        }
      } else {
        const dx2 = dx0 - OpenSimplex2S.UNSKEW_2D;
        const dy2 = dy0 - (OpenSimplex2S.UNSKEW_2D + 1);
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp,
              ysbp + OpenSimplex2S.PRIME_Y,
              dx2,
              dy2
            );
        }
      }

      if (yi - xmyi > 1) {
        const dx3 = dx0 - (3 * OpenSimplex2S.UNSKEW_2D + 1);
        const dy3 = dy0 - (3 * OpenSimplex2S.UNSKEW_2D + 2);
        const a3 = OpenSimplex2S.RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
        if (a3 > 0) {
          value +=
            a3 *
            a3 *
            (a3 * a3) *
            OpenSimplex2S.grad(
              seed,
              xsbp + OpenSimplex2S.PRIME_X,
              ysbp + (OpenSimplex2S.PRIME_Y << 1),
              dx3,
              dy3
            );
        }
      } else {
        const dx3 = dx0 - (OpenSimplex2S.UNSKEW_2D + 1);
        const dy3 = dy0 - OpenSimplex2S.UNSKEW_2D;
        const a3 = OpenSimplex2S.RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
        if (a3 > 0) {
          value +=
            a3 *
            a3 *
            (a3 * a3) *
            OpenSimplex2S.grad(
              seed,
              xsbp + OpenSimplex2S.PRIME_X,
              ysbp,
              dx3,
              dy3
            );
        }
      }
    } else {
      if (xi + xmyi < 0) {
        const dx2 = dx0 + (1 + OpenSimplex2S.UNSKEW_2D);
        const dy2 = dy0 + OpenSimplex2S.UNSKEW_2D;
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp - OpenSimplex2S.PRIME_X,
              ysbp,
              dx2,
              dy2
            );
        }
      } else {
        const dx2 = dx0 - (OpenSimplex2S.UNSKEW_2D + 1);
        const dy2 = dy0 - OpenSimplex2S.UNSKEW_2D;
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp + OpenSimplex2S.PRIME_X,
              ysbp,
              dx2,
              dy2
            );
        }
      }

      if (yi < xmyi) {
        const dx2 = dx0 + OpenSimplex2S.UNSKEW_2D;
        const dy2 = dy0 + (OpenSimplex2S.UNSKEW_2D + 1);
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp,
              ysbp - OpenSimplex2S.PRIME_Y,
              dx2,
              dy2
            );
        }
      } else {
        const dx2 = dx0 - OpenSimplex2S.UNSKEW_2D;
        const dy2 = dy0 - (OpenSimplex2S.UNSKEW_2D + 1);
        const a2 = OpenSimplex2S.RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
        if (a2 > 0) {
          value +=
            a2 *
            a2 *
            (a2 * a2) *
            OpenSimplex2S.grad(
              seed,
              xsbp,
              ysbp + OpenSimplex2S.PRIME_Y,
              dx2,
              dy2
            );
        }
      }
    }

    return value;
  }

  private static grad(
    seed: number,
    xsb: number,
    ysb: number,
    x: number,
    y: number
  ): number {    // const h = (seed ^ (xsb * OpenSimplex2S.HASH_MULTIPLIER + ysb)) & 0xff;
    const noise = makePointGeneratorFast(seed);
    const h = noise(xsb, ysb) * 0xff;
    // h =
    const u = (h & 0x0f) - 8;
    const v = (h >> 4) - 8;
    const r = (u * x + v * y) * 0.7071067811865476;
    // console.log(r)

    return r; // Scale factor for 2D gradients
  }

  private static fastFloor(x: number): number {
    // return Math.floor(x)
    const xi = Math.floor(x);
    return x < xi ? xi - 1 : xi;
  }
}

// // Example usage
// const seed = 12345; // Your desired seed value
// const x = 1.5; // X coordinate
// const y = 2.3; // Y coordinate

// const noiseValue = OpenSimplex2S.noise2(seed, x, y);
// console.log(noiseValue);
