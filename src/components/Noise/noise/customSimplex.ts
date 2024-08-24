import { Coord } from "../lib/interfaces";
import { makePointGenerator, makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);
  const fastNoise = makePointGeneratorFast(seed);

  const smoothstep = (t: number): number => t * t * (3 - t * 2);

  const smootherstep = (t: number): number =>
    t * t * t * (t * (t * 6 - 15) + 10);

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  function barycentricInterp(
    p0: number,
    p1: number,
    p2: number, // Values at the three triangle vertices
    u: number,
    v: number // Barycentric coordinates u and v
  ): number {
    const w = 1 - u - v; // Barycentric coordinate w

    // Return the weighted sum of the three points
    return p0 * w + p1 * u + p2 * v;
  }

  const vectorsCacheSize = 256;
  const vectorsCache: Coord[] = Array.from(
    { length: vectorsCacheSize },
    (_, i) => {
      const theta = (i / vectorsCacheSize) * 2 * Math.PI;
      return { x: Math.cos(theta), y: Math.sin(theta) };
    }
  );

  const prngVector = (x: number, y: number) => {
    const theta = (fastNoise(x, y) * vectorsCacheSize) & (vectorsCacheSize - 1);
    return vectorsCache[theta];
  };

  return (coord: Coord, scale: number = 16): number => {
    const skewFactor = -1 / 2;
    const xSkewed = coord.x + coord.y * skewFactor;
    const ySkewed = coord.y;

    // try not using scale for a performance boost
    const x = Math.floor(xSkewed / scale);
    const y = Math.floor(ySkewed / scale);
    const fx = (xSkewed - x * scale) / scale;
    const fy = (ySkewed - y * scale) / scale;

    const topLeft = fx + fy < 1;
    if (topLeft) {
      const v = smoothstep(fy);
      const w = smoothstep(fx);
      const u = 1 - v - w;

      const v0 = prngVector(x, y);
      const p0 = v0.x * fx + v0.y * fy;

      const v1 = prngVector(x, y + 1);
      const p1 = v1.x * fx + v1.y * (fy - 1);

      const v2 = prngVector(x + 1, y);
      const p2 = v2.x * (fx - 1) + v2.y * fy;

      return u * p0 + v * p1 + w * p2;
    } else {
      const v = smoothstep(1 - fy);
      const w = smoothstep(1 - fx);
      const u = 1 - v - w;

      const v0 = prngVector(x + 1, y + 1);
      const p0 = v0.x * (fx - 1) + v0.y * (fy - 1);

      const v1 = prngVector(x + 1, y);
      const p1 = v1.x * (fx - 1) + v1.y * fy;

      const v2 = prngVector(x, y + 1);
      const p2 = v2.x * fx + v2.y * (fy - 1);

      return u * p0 + v * p1 + w * p2;
    }
  };
};
