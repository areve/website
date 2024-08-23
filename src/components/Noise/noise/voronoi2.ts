import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "../noise/prng";

export const makeVoronoi2NoiseGenerator = (seed: number) => {
  const noise = new WorleyNoise(seed, 2);

  return (coord: Coord): number => {
    return noise.point({ x: coord.x, y: coord.y, z: 0 });
  };
};

class WorleyNoise {
  private dimension: 2 | 3;
  private prng!: (coord: Coord) => number;
  private cache: { key: string; value: Coord[] }[] = [];

  constructor(seed: number, dimension: 2 | 3 = 2) {
    this.dimension = dimension;
    this.prng = makePointGenerator(seed);
  }

  point(coord: Coord): number {
    const scale = 2;
    const size = 64;
    const pointsPerAnchor = 5;
    const offsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const anchors = offsets.map((v) => ({
      x: (Math.floor(coord.x / size) + v.x) * size,
      y: (Math.floor(coord.y / size) + v.y) * size,
    }));
    const points = anchors.flatMap((anchor: Coord) =>
      Array.from({ length: pointsPerAnchor }).map((_, i) => ({
        x: anchor.x + (this.prng({ ...anchor, z: i }) - 0.5) * size,
        y: anchor.y + (this.prng({ ...anchor, w: i }) - 0.5) * size,
      }))
    );
    return (
      (points.reduce((minDist, p) => {
        const dx = coord.x - p.x;
        const dy = coord.y - p.y;
        const dz = this.dimension === 2 ? 0 : (coord.z ?? 0) - (p.z ?? 0);
        const dist = dx * dx + dy * dy + dz * dz;
        return Math.min(dist, minDist);
      }, Infinity) **
        0.5 /
        size) *
      scale
    );
  }
}
