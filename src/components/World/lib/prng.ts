import { Dimension } from "../maps/makeLayer";

export interface LayerProps extends Dimension {
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

  getPoint(x: number, y: number): number {
    const n = this.seed + x * 374761393 + y * 668265263;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  }
}
