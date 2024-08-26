import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const noise = makeNoise2D(seed);

  return (coord: Coord, scale: number = 8): number => {
    return noise(coord.x / scale, coord.y / scale);
  };
};

const NORM_2D = 1.0 / 47.0;
const SQUISH_2D = (Math.sqrt(2 + 1) - 1) / 2;
const STRETCH_2D = (1 / Math.sqrt(2 + 1) - 1) / 2;

type Noise2D = (x: number, y: number) => number;

interface Contribution2D {
  dx: number;
  dy: number;
  next?: Contribution2D;
  xsb: number;
  ysb: number;
}

function contribution2D(
  multiplier: number,
  xsb: number,
  ysb: number
): Contribution2D {
  return {
    dx: -xsb - multiplier * SQUISH_2D,
    dy: -ysb - multiplier * SQUISH_2D,
    xsb,
    ysb,
  };
}

export function makeNoise2D(seed: number): Noise2D {
  const fastNoise = makePointGeneratorFast(seed);

  const contributions: Contribution2D[] = [];
  for (let i = 0; i < p2D.length; i += 4) {
    const baseSet = base2D[p2D[i]];
    let previous: Contribution2D | null = null;
    let current: Contribution2D | null = null;
    for (let k = 0; k < baseSet.length; k += 3) {
      current = contribution2D(baseSet[k], baseSet[k + 1], baseSet[k + 2]);
      if (previous === null) contributions[i / 4] = current;
      else previous.next = current;
      previous = current;
    }
    current!.next = contribution2D(p2D[i + 1], p2D[i + 2], p2D[i + 3]);
  }

  const lookup: Contribution2D[] = [];
  for (let i = 0; i < lookupPairs2D.length; i += 2) {
    lookup[lookupPairs2D[i]] = contributions[lookupPairs2D[i + 1]];
  }

  return (x: number, y: number): number => {
    const stretchOffset = (x + y) * STRETCH_2D;
    const xs = x + stretchOffset;
    const ys = y + stretchOffset;
    const xsb = Math.floor(xs);
    const ysb = Math.floor(ys);
    const squishOffset = (xsb + ysb) * SQUISH_2D;
    const dx0 = x - (xsb + squishOffset);
    const dy0 = y - (ysb + squishOffset);
    const xins = xs - xsb;
    const yins = ys - ysb;
    const inSum = xins + yins;
    const hash =
      (xins - yins + 1) |
      (inSum << 1) |
      ((inSum + yins) << 2) |
      ((inSum + xins) << 4);

    let value = 0;

    for (
      let c: Contribution2D | undefined = lookup[hash];
      c !== undefined;
      c = c.next
    ) {
      const dx = dx0 + c.dx;
      const dy = dy0 + c.dy;
      const attn = 2 - dx * dx - dy * dy;
      if (attn > 0) {
        const px = xsb + c.xsb;
        const py = ysb + c.ysb;

        // Use fastNoise(coord) instead of perm/perm2D
        const noiseValue = fastNoise(px, py);

        // Convert noiseValue (0-1) to appropriate gradient index
        const gradientIndex =
          Math.floor((noiseValue * gradients2D.length) / 2) * 2;

        const valuePart =
          gradients2D[gradientIndex] * dx + gradients2D[gradientIndex + 1] * dy;
        value += attn * attn * attn * attn * valuePart;
      }
    }

    return value * NORM_2D;
  };
}

const base2D = [
  [1, 1, 0, 1, 0, 1, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 2, 1, 1],
];

const gradients2D = [5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5];

const lookupPairs2D = [
  0, 1, 1, 0, 4, 1, 17, 0, 20, 2, 21, 2, 22, 5, 23, 5, 26, 4, 39, 3, 42, 4, 43,
  3,
];

const p2D = [
  0, 0, 1, -1, 0, 0, -1, 1, 0, 2, 1, 1, 1, 2, 2, 0, 1, 2, 0, 2, 1, 0, 0, 0,
];
