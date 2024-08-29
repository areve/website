import { makeNoiseGenerator } from "./prng";

export const makeValueNoiseGenerator = (seed: number, scale: number = 8) => {
  const noise = makeNoiseGenerator(seed);

  const smoothstepHalf = (t: number): number => (t * t * (3 - t * 2) + t) / 2;

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  return (x: number, y: number): number => {
    const ix = Math.floor(x / scale);
    const iy = Math.floor(y / scale);
    const fx = (x % scale) / scale;
    const fy = (y % scale) / scale;

    const p0 = noise(ix, iy);
    const p1 = noise(ix, iy + 1);
    const p2 = noise(ix + 1, iy);
    const p3 = noise(ix + 1, iy + 1);

    const sx = smoothstepHalf(fx);
    const sy = smoothstepHalf(fy);
    const m1 = lerp(p0, p1, sy);
    const m2 = lerp(p2, p3, sy);
    return lerp(m1, m2, sx);
  };
};
