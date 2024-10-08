import { Coord } from "../lib/interfaces";

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

export const makePointGenerator = (seed: number) => {
  const a = new Uint32Array(new Float64Array([seed]).buffer);
  const s = a[0] ^ a[1];
  return (coord: Coord): number => {
    const n = s + coord.x * 374761393 + coord.y * 668265263;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  };
}