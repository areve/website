import { Coord } from "../lib/interfaces";
import { makePointGenerator, makePointGeneratorFast } from "./prng";

export const makeValueNoiseGenerator = (seed: number, scale: number = 8) => {
  const noise = makePointGeneratorFast(seed);

  const smoothstepHalf = (t: number): number => (t * t * (3 - t * 2) + t) / 2;

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  return (coord: Coord): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x / scale) - x;
    const fy = (coord.y / scale) - y;

    const p0 = noise(x, y);
    const p1 = noise(x, y + 1);
    const p2 = noise(x + 1, y);
    const p3 = noise(x + 1, y + 1);

    const sx = smoothstepHalf(fx);
    const sy = smoothstepHalf(fy);
    const m1 = lerp(p0, p1, sy);
    const m2 = lerp(p2, p3, sy);
    return lerp(m1, m2, sx);
  };
};
