import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "../noise/prng";

export const makeVoronoi2NoiseGenerator = (seed: number) => {
  const noise = new WorleyNoise(seed, 2);

  return (coord: Coord): number => {
    return noise.point({ x: coord.x, y: coord.y, z: 0 }, 1);
  };
};

class WorleyNoise {
  private dimension: 2 | 3;
  prng!: (coord: Coord) => number;

  constructor(seed: number, dimension: 2 | 3 = 2) {
    this.dimension = dimension;
    this.prng = makePointGenerator(seed);
  }

  point(coord: Coord, k: number): number {
    let anchors = [
      {
        x: Math.floor(coord.x / 100) * 100,
        y: Math.floor(coord.y / 100) * 100,
      },
      {
        x: Math.ceil(coord.x / 100) * 100,
        y: Math.floor(coord.y / 100) * 100,
      },
      {
        x: Math.floor(coord.x / 100) * 100,
        y: Math.ceil(coord.y / 100) * 100,
      },
      {
        x: Math.ceil(coord.x / 100) * 100,
        y: Math.ceil(coord.y / 100) * 100,
      },
    ];

    const addPointsAround = (anchor: Coord) => {
      const points: Coord[] = [];
      for (let i = 0; i < 5; i++) {
        const point = {
          x: anchor.x + this.prng({ ...anchor, z: i }) * 100 - 50,
          y: anchor.y + this.prng({ ...anchor, z: i * 12334666787 }) * 100 - 50,
        };
        points.push(point);
      }
      return points;
    };

    const points = anchors.flatMap((anchor) => addPointsAround(anchor));
    let minDist: number = 0;
    points.forEach((p) => {
      p.selected = false;
    });

    for (let j = 0; j < k; ++j) {
      let minIdx: number | undefined;
      minDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < points.length; ++i) {
        const p = points[i];
        const dz = this.dimension === 2 ? 0 : (coord.z ?? 0) - (p.z ?? 0);
        const dist = euclidean(coord.x - p.x, coord.y - p.y, dz);

        if (dist < minDist && !p.selected) {
          minDist = dist;
          minIdx = i;
        }
      }

      if (minIdx !== undefined) {
        points[minIdx].selected = true;
      }
    }

    return Math.sqrt(minDist) / 50;
  }
}

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;
