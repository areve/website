import { Coord } from "../lib/interfaces";

export const makePointGenerator = (seed: number) => {
  const a = new Uint32Array(new Float64Array([seed]).buffer);
  const s = a[0] ^ a[1];
  return (coord: Coord): number => {
    const n =
      s +
      coord.x * 374761393 +
      coord.y * 668265263 +
      (coord.z ?? 0) * 1440662683 +
      (coord.w ?? 0) * 3865785317;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  };
};
