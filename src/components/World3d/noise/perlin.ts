import { makeNoiseGenerator } from "./prng";

export const makePerlinGenerator = (seed: number, scale: number = 8) => {
  const noise = makeNoiseGenerator(seed);

  const smootherstep = (t: number): number =>
    t * t * t * (t * (t * 6 - 15) + 10);

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const prngVector = (x: number, y: number) => {
    const theta = noise(x, y, 1) * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  };

  return (x: number, y: number): number => {
    const ix = Math.floor(x / scale);
    const iy = Math.floor(y / scale);
    const fx = x / scale - ix;
    const fy = y / scale - iy;

    const v0 = prngVector(ix, iy);
    const v1 = prngVector(ix, iy + 1);
    const v2 = prngVector(ix + 1, iy);
    const v3 = prngVector(ix + 1, iy + 1);

    // Calculate the dot products
    const dot0 = v0.x * fx + v0.y * fy;
    const dot1 = v1.x * fx + v1.y * (fy - 1);
    const dot2 = v2.x * (fx - 1) + v2.y * fy;
    const dot3 = v3.x * (fx - 1) + v3.y * (fy - 1);

    // Interpolate between the dot products
    const sx = smootherstep(fx);
    const sy = smootherstep(fy);
    const m1 = lerp(dot0, dot1, sy);
    const m2 = lerp(dot2, dot3, sy);
    return lerp(m1, m2, sx) * 0.5 + 0.5;
  };
};
