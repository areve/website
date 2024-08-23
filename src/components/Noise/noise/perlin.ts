import { makePointGenerator } from "./../../World/noise/prng";
import { Coord, Vector } from "../lib/interfaces";

export const makePerlinNoiseGenerator = (seed: number) => {
  const perlin = new PerlinNoise();
  perlin.seed(seed);

  return (coord: Coord): number => {
    return perlin.get(coord.x, coord.y);
  };
};

class PerlinNoise {
  private gradients: { [key: string]: Vector } = {};
  private memory: { [key: string]: number } = {};

  private prng!: (coord: Coord) => number;
  private randVect(x: number, y: number): Vector {
    const theta = this.prng({ x, y }) * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  }

  private dotProdGrid(x: number, y: number, vx: number, vy: number): number {
    const key = `${vx},${vy}`;
    let gVect: Vector;
    const dVect = { x: x - vx, y: y - vy };
    if (this.gradients[key]) {
      gVect = this.gradients[key];
    } else {
      gVect = this.randVect(x, y);
      this.gradients[key] = gVect;
    }
    return dVect.x * gVect.x + dVect.y * gVect.y;
  }

  private smootherstep(x: number): number {
    return 6 * Math.pow(x, 5) - 15 * Math.pow(x, 4) + 10 * Math.pow(x, 3);
  }

  private interp(x: number, a: number, b: number): number {
    return a + this.smootherstep(x) * (b - a);
  }

  public seed(seed: number): void {
    this.prng = makePointGenerator(seed);
    this.gradients = {};
    this.memory = {};
  }

  public get(x: number, y: number): number {
    const key = `${x},${y}`;
    if (this.memory.hasOwnProperty(key)) {
      return this.memory[key];
    }

    const xf = Math.floor(x);
    const yf = Math.floor(y);

    // Interpolate
    const tl = this.dotProdGrid(x, y, xf, yf);
    const tr = this.dotProdGrid(x, y, xf + 1, yf);
    const bl = this.dotProdGrid(x, y, xf, yf + 1);
    const br = this.dotProdGrid(x, y, xf + 1, yf + 1);

    const xt = this.interp(x - xf, tl, tr);
    const xb = this.interp(x - xf, bl, br);
    const v = this.interp(y - yf, xt, xb);

    this.memory[key] = v;
    return v;
  }
}
