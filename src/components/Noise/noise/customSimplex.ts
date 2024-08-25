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

  const getWeight = (
    w: number,
    x: number,
    y: number,
    fx: number,
    fy: number
  ) => {
    const v0 = prngVector(x, y);
    return (v0.x * fx + v0.y * fy) * smoothstep(w);
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
      const v = fy;
      const w = fx;
      const u = 1 - v - w;

      const p0 = getWeight(u, x, y, fx, fy);
      const p1 = getWeight(v, x, y + 1, fx, fy - 1);
      const p2 = getWeight(w, x + 1, y, fx - 1, fy);

      return p0 + p1 + p2;
    } else {
      const v = 1 - fy;
      const w = 1 - fx;
      const u = 1 - v - w;

      const p0 = getWeight(u, x + 1, y + 1, fx - 1, fy - 1);
      const p1 = getWeight(v, x + 1, y, fx - 1, fy);
      const p2 = getWeight(w, x, y + 1, fx, fy - 1);

      return p0 + p1 + p2;
    }
  };
};
