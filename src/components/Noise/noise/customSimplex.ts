import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const fastNoise = makePointGeneratorFast(seed);

  const smoothstep = (t: number): number => t * t * (3 - t * 2);

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
      const v1 = prngVector(x, y + 1);
      const v2 = prngVector(x + 1, y);

      const p0 = v0.x * fx + v0.y * fy;
      const p1 = v1.x * fx + v1.y * (fy - 1);
      const p2 = v2.x * (fx - 1) + v2.y * fy;

      return u * p0 + v * p1 + w * p2;
    } else {
      const v = smoothstep(1 - fy);
      const w = smoothstep(1 - fx);
      const u = 1 - v - w;

      const v0 = prngVector(x + 1, y + 1);
      const v1 = prngVector(x + 1, y);
      const v2 = prngVector(x, y + 1);

      const p0 = v0.x * (fx - 1) + v0.y * (fy - 1);
      const p1 = v1.x * (fx - 1) + v1.y * fy;
      const p2 = v2.x * fx + v2.y * (fy - 1);

      return u * p0 + v * p1 + w * p2;
    }
  };
};
