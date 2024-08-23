import { Coord } from "../lib/interfaces";

export const makeVoronoi2NoiseGenerator = (seed: number) => {
  const noise = new WorleyNoise({
    numPoints: 25,
    /*seed: 42,*/
    dim: 2, //,*/
  });

  return (coord: Coord): number => {
    return noise.getEuclidean({ x: coord.x, y: coord.y, z: 0 }, 1);
  };
};

// Type definitions for configuration and point
interface WorleyNoiseConfig {
  dim?: 2 | 3;
  seed?: number;
  numPoints?: number;
  z?: number;
  callback?: (
    e: (value: number) => number,
    m: (value: number) => number
  ) => number;
  normalize?: boolean;
}

interface Point {
  x: number;
  y: number;
  z: number;
  selected?: boolean;
}

class WorleyNoise {
  private _dim: 2 | 3;
  private _rng: (seed?: number) => number;
  private _points: Point[];

  constructor(config: WorleyNoiseConfig = {}) {
    if (config.dim !== 2 && config.dim !== 3 && config.dim !== undefined) {
      throw new Error('"dim" can be 2 or 3');
    }

    this._dim = config.dim || 2;
    this._rng = () => Math.random();
    this._points = [];

    for (let i = 0; i < (config.numPoints || 0); i++) {
      this._points.push({
        x: this._rng(),
        y: this._rng(),
        z: this._rng(),
      });
    }
  }

  addPoint(coord: Point): void {
    this._points.push(coord);
  }

  getEuclidean(coord: Point, k: number): number {
    let minDist: number = 0;
    this._points.forEach((p) => {
      p.selected = false;
    });

    for (let j = 0; j < k; ++j) {
      let minIdx: number | undefined;
      minDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < this._points.length; ++i) {
        const p = this._points[i];
        const dz = this._dim === 2 ? 0 : coord.z - p.z;
        const dist = euclidean(coord.x - p.x, coord.y - p.y, dz);

        if (dist < minDist && !p.selected) {
          minDist = dist;
          minIdx = i;
        }
      }

      if (minIdx !== undefined) {
        this._points[minIdx].selected = true;
      }
    }

    return Math.sqrt(minDist);
  }
}

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;
