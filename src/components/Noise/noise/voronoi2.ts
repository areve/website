import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "../noise/prng";

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
    const offsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const anchors = offsets.map((v) => ({
      x: (Math.floor(coord.x / s) + v.x) * s,
      y: (Math.floor(coord.y / s) + v.y) * s,
    }));
    const points = anchors.flatMap((anchor: Coord) =>
      Array.from({ length: d }).map(
        (_, i): Coord => ({
          x: anchor.x + (this.prng({ ...anchor, z: i }) - 0.5) * s,
          y: anchor.y + (this.prng({ ...anchor, w: i }) - 0.5) * s,
          z:
            this.dimension == 2
              ? 0
              : (this.prng({ ...anchor, z: i, w: i }) - 0.5) * s,
        })
      )
    );
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
