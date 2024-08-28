import { Coord } from "../lib/interfaces";

export const makePointGeneratorFast = (seed: number) => {
  const a = new Uint32Array(new Float64Array([seed]).buffer);
  const s = a[0] ^ (a[1] + 1440662683);
  return (x: number, y: number, z: number = 0, w: number = 0): number => {
    const n =
      s + x * 374761393 + y * 668265263 + z * 1440662683 + w * 3865785317;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  };
};

export const makePointGenerator = (seed: number) => {
  const noise = makePointGeneratorFast(seed);
  return (coord: Coord): number => noise(coord.x, coord.y, coord.z, coord.w);
};
