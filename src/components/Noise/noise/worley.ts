import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;

export const sqrt = (v: number) => v ** 0.5;

export const makeWorleyNoiseGenerator = (
  seed: number,
  dimensions: 2 | 3 = 3,
  scale: number = 8,
  density: number = 1,
  calculateDistance: typeof euclidean = euclidean,
  finalApply: typeof sqrt | null = sqrt
) => {
  const noise = makePointGeneratorFast(seed);

  const cache: any = {};

  return (x: number, y: number): number => {
    const ix = x / scale;
    const iy = y / scale;
    const zzx = Math.floor(ix);
    const zzy = Math.floor(iy);
    const fx = ix - zzx;
    const fy = iy - zzy;

    const points = makePointsSquare(zzx, zzy, dimensions, density);
    const n = findNearest(points, calculateDistance, fx, fy);

    if (!finalApply) return n;
    return finalApply(n);
  };

  function findNearest(
    points: Coord[],
    method: (dx: number, dy: number, dz: number) => number,
    fx: number,
    fy: number
  ) {
    return points.reduce(
      (p, v) => Math.min(method(fx - v.x, fy - v.y, v.z ?? 0), p),
      Infinity
    );
  }

  function makePointsSquare(
    x: number,
    y: number,
    dimensions: number,
    density: number
  ): Coord[] {
    return (cache[`${x}+${y}`] ??= [
      makePoints(x, y, 0, 0, dimensions, density),
      makePoints(x, y, 1, 0, dimensions, density),
      makePoints(x, y, 0, 1, dimensions, density),
      makePoints(x, y, 1, 1, dimensions, density),
    ].flat());
  }

  function makePoints(
    ix: number,
    iy: number,
    cx: number,
    cy: number,
    dimensions: number,
    density: number
  ): Coord[] {
    return (cache[`${ix}+${cx},${iy}+${cy}`] ??= Array.from({
      length: density,
    }).map((_, i): Coord => {
      const h = noise(ix + cx, iy + cy, i) * 0xffffff;
      const x = cx + ((h & 0xff) / 0xff - 0.5);
      const y = cy + (((h >> 8) & 0xff) / 0xff - 0.5);
      const z = dimensions == 2 ? 0 : ((h >> 16) & 0xff) / 0xff - 0.5;
      return { x, y, z };
    }));
  }
};
