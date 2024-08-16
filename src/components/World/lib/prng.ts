import { Coord } from "./interfaces";

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

// TODO SUPER SLOW, don't know why yet
export const pointGenerator = (coord: Coord, seed: number) => {
  const n = seed + coord.x * 374761393 + coord.y * 668265263;
  const m = (n ^ (n >> 13)) * 1274126177;
  return (m >>> 0) / 0xffffffff;
};
