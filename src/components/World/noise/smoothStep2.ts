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
  const x = (((r ^ (r >> 13)) * 3462567047) >> 0) / 0xffffffff;
  const y = (((r ^ (r >> 13)) * 5465562853) >> 0) / 0xffffffff;

  return { x, y };
};

const getVectorLength = (x: number, y: number) => {
  return Math.sqrt(x * x + y * y);
};

export const makeCustomNoiseGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord, scale: number = 32): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    let fx = (coord.x % scale) / scale;
    let fy = (coord.y % scale) / scale;

    fx = smoothstep(fx);
    fy = smoothstep(fy);

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
    const dot0 = (n0.x * fx + n0.y * fy) * getVectorLength(n0.x, n0.y);
    const dot1 = (n1.x * fx + n1.y * (fy - 1)) * getVectorLength(n1.x, n1.y);
    const dot2 = (n2.x * (fx - 1) + n2.y * fy) * getVectorLength(n2.x, n2.y);
    const dot3 =
      (n3.x * (fx - 1) + n3.y * (fy - 1)) * getVectorLength(n3.x, n3.y);

    // Weight each noise value based on the dot product with its normal
    let w0 = (1 - fx) * (1 - fy) * dot0;
    let w1 = (1 - fx) * fy * dot1;
    let w2 = fx * (1 - fy) * dot2;
    let w3 = fx * fy * dot3;

    const soften = 0.0001;
    const sumW =
      Math.abs(w0) + Math.abs(w1) + Math.abs(w2) + Math.abs(w3) + soften;
    w0 = w0 / sumW / 2;
    w1 = w1 / sumW / 2;
    w2 = w2 / sumW / 2;
    w3 = w3 / sumW / 2;

    // Sum the weighted noise values
    // return (p0 + p1 + p2 + p3) / 4
    return p0 * w0 + p1 * w1 + p2 * w2 + p3 * w3 + 0.5;
  };
};
