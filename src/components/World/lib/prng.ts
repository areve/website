import { Coord, Dimensions } from "../maps/render";

export interface LayerProps extends Dimensions {
  seed: number;
  width: number;
  height: number;
}

export interface LayerMethods {
  pixel: (x: number, y: number) => number[];
}

export class PointGenerator {
  private seed: number;
  constructor(seed: number) {
    const n = new Uint32Array(new Float64Array([seed]).buffer);
    this.seed = n[0] ^ n[1];
  }

  point(coord: Coord): number {
    const n = this.seed + coord.x * 374761393 + coord.y * 668265263;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  }
}
