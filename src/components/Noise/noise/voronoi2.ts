import { Coord } from "../lib/interfaces";
import { makePointGenerator, makePointGeneratorFast } from "../noise/prng";

export const makeVoronoi2NoiseGenerator = (
  seed: number,
  dimension: 2 | 3 = 2,
  size: number = 64,
  density: number = 5
) => {
  const noise = makePointGeneratorFast(seed);

  // const worleyNoise = new WorleyNoise(dimension, density);
  return (coord: Coord): number => {
    return point(coord.x / size, coord.y / size);
  };

  function point(ix: number, iy: number): number {
    const x = Math.floor(ix);
    const y = Math.floor(iy);
    const fx = ix - x;
    const fy = iy - y;

    const makePoints = (
      ix: number,
      iy: number,
      cx: number,
      cy: number,
      dimension: number,
      density: number
    ) =>
      Array.from({ length: density }).map((_, i): Coord => {
        const h = noise(ix + cx, iy + cy) * 0xffffff;
        const x = cx + ((h & 0xff) / 0xff - 0.5);
        const y = cy + (((h >> 8) & 0xff) / 0xff - 0.5);
        const z = dimension == 2 ? 0 : ((h >> 16) & 0xff) / 0xff - 0.5;
        return { x, y, z };
      });

    const points = [
      makePoints(x, y, 0, 0, dimension, density),
      makePoints(x, y, 1, 0, dimension, density),
      makePoints(x, y, 0, 1, dimension, density),
      makePoints(x, y, 1, 1, dimension, density),
    ].flat();

    return Math.sqrt(
      points.reduce(
        (p, v) => Math.min(euclidean(fx - v.x, fy - v.y, v.z ?? 0), p),
        Infinity
      )
    );
  }
};

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;

// class WorleyNoise {
//   private dimension: 2 | 3;
//   private density: number;

//   constructor(dimension: 2 | 3, density: number) {
//     this.dimension = dimension;
//     this.density = density;
//   }
