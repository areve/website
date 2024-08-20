import { Coord } from "../lib/interfaces";

export const makeVoronoiNoiseGenerator = (seed: number) => {
  const noise = new WorleyNoise({
    numPoints: 25,
    /*seed: 42,*/
    dim: 2,//,*/
});


  return (coord: Coord): number => {
    return noise.getEuclidean({ x: coord.x / 200, y: coord.y / 200, z: 0}, 1) * 2 ;
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
    return Math.sqrt(this._calculateValue(coord, k, euclidean));
  }

  getManhattan(coord: Point, k: number): number {
    return this._calculateValue(coord, k, manhattan);
  }

  renderImage(resolution: number, config: WorleyNoiseConfig = {}): number[] {
    const step = 1 / (resolution - 1);
    const img = new Array<number>(resolution * resolution);
    const callback =
      config.callback ||
      ((e: (value: number) => number, m: (value: number) => number) => e(1));
    const z = config.z || 0;

    const e = (k: number) =>
      Math.sqrt(this._calculateValue({ x: 0, y: 0, z }, k, euclidean));
    const m = (k: number) =>
      this._calculateValue({ x: 0, y: 0, z }, k, manhattan);

    for (let y = 0; y < resolution; ++y) {
      for (let x = 0; x < resolution; ++x) {
        img[y * resolution + x] = callback(e, m);
      }
    }

    if (!config.normalize) {
      return img;
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    img.forEach((v) => {
      min = Math.min(min, v);
      max = Math.max(max, v);
    });

    const scale = 1 / (max - min);
    return img.map((v) => (v - min) * scale);
  }

  private _calculateValue(
    coord: Point,
    k: number,
    distFn: (dx: number, dy: number, dz: number) => number
  ): number {
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
        const dist = distFn(coord.x - p.x, coord.y - p.y, dz);

        if (dist < minDist && !p.selected) {
          minDist = dist;
          minIdx = i;
        }
      }

      if (minIdx !== undefined) {
        this._points[minIdx].selected = true;
      }
    }

    return minDist;
  }
}

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;
const manhattan = (dx: number, dy: number, dz: number) =>
  Math.abs(dx) + Math.abs(dy) + Math.abs(dz);

export default WorleyNoise;
