import { Coord } from "../lib/interfaces";
import { makePointGenerator, makePointGeneratorFast } from "../noise/prng";

export const makeVoronoi2NoiseGenerator = (
  seed: number,
  dimension: 2 | 3 = 2,
  size: number = 64,
  density: number = 5
) => {
  const noise = new WorleyNoise(seed, dimension, size, density);
  return (coord: Coord): number => {
    return noise.point({ x: coord.x, y: coord.y, z: 0 });
  };
};

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;

const noise = makePointGeneratorFast(123456);

class WorleyNoise {
  private dimension: 2 | 3;
  private size: number;
  private density: number;
  private prng!: (coord: Coord) => number;

  constructor(seed: number, dimension: 2 | 3, size: number, density: number) {
    this.dimension = dimension;
    this.size = size;
    this.density = density;
    this.prng = makePointGenerator(seed);
  }

  point(coord: Coord): number {
    const s = this.size;
    const d = this.density;

    const x = Math.floor(coord.x / s);
    const y = Math.floor(coord.y / s);
    const fx = coord.x / s - x;
    const fy = coord.y / s - y;

    const dimension = this.dimension;

    function makePoints(ix: number, iy: number, cx: number, cy: number) {
      const ax = (ix + cx) * s;
      const ay = (iy + cy) * s;

      return Array.from({ length: d }).map((_, i): Coord => {
        const h = noise(ix + cx, iy + cy) * 0xffffff;
        const x = ax + ((h & 0xff) / 0xff - 0.5) * s;
        const y = ay + (((h >> 8) & 0xff) / 0xff - 0.5) * s;
        const z = dimension == 2 ? 0 : (((h >> 16) & 0xff) / 0xff - 0.5) * s;
        return { x, y, z };
      });
    }

    const points = [
      makePoints(x, y, 0, 0),
      makePoints(x, y, 1, 0),
      makePoints(x, y, 0, 1),
      makePoints(x, y, 1, 1),
    ].flat();

    return (
      Math.sqrt(
        points.reduce(
          (p, v) =>
            Math.min(euclidean(coord.x - v.x, coord.y - v.y, v.z ?? 0), p),
          Infinity
        )
      ) / s
    );
  }
}
