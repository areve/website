import { Coord } from "../lib/interfaces";
import { clamp } from "../lib/other";
import { makePointGenerator } from "./prng";

const smoothstep = (t: number): number => {
  return t * t * (3 - t * 2);
};

// Linear interpolation function
const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

const getNormal = (v: number) => {
  const r = v * 4719218597;
  const x = (((r ^ (r >> 13)) * 3462567047) >> 0) / 0xffffff;
  const y = (((r ^ (r >> 13)) * 5465562853) >> 0) / 0xffffff;
  return { x, y };
};

function normalize(vector: { x: number; y: number }): { x: number; y: number } {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return { x: vector.x / length, y: vector.y / length };
}

export const makeCustomNoiseGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord, scale: number = 32): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x % scale) / scale;
    const fy = (coord.y % scale) / scale;

    const p0 = noise({ x, y });
    const p1 = noise({ x, y: y + 1 });
    const p2 = noise({ x: x + 1, y });
    const p3 = noise({ x: x + 1, y: y + 1 });

    const n0 = getNormal(p0);
    const n1 = getNormal(p1);
    const n2 = getNormal(p2);
    const n3 = getNormal(p3);
    // console.log(n3);

    // Calculate the influence of each normal based on fx, fy
    const dot0 = n0.x * fx + n0.y * fy;
    const dot1 = n1.x * fx + n1.y * (fy - 1);
    const dot2 = n2.x * (fx - 1) + n2.y * fy;
    const dot3 = n3.x * (fx - 1) + n3.y * (fy - 1);

    // Weight each noise value based on the dot product with its normal
    const w0 = (1 - fx) * (1 - fy) * dot0;
    const w1 = (1 - fx) * fy * dot1;
    const w2 = fx * (1 - fy) * dot2;
    const w3 = fx * fy * dot3;

    const sumW = Math.abs(w0) + Math.abs(w1) + Math.abs(w2) + Math.abs(w3);

    // console.log(w0, w1, w2, w3)
    // Sum the weighted noise values
    const result = (p0 * w0 + p1 * w1 + p2 * w2 + p3 * w3) / (sumW + 0.00000001);

    //   console.log(result)
    return (result + 1) / 2;
  };
};
