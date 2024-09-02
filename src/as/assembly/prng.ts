export type NoiseGenerator = (x: f64, y: f64, z: f64, w: f64) => f64;

let seedLow: i32 = 0;
let seedHigh: i32 = 0;
let s: i32 = 0;

export const makeNoiseGenerator = (seed: i64): NoiseGenerator => {
  seedLow = <i32>seed;
  seedHigh = <i32>(seed >> 32);
  s = seedLow ^ (seedHigh + 1440662683);
  return (x: f64, y: f64, z: f64 = 0, w: f64 = 0): f64 => {
    const n: f64 =
      s + x * 374761393 + y * 668265263 + z * 1440662683 + w * 3865785317;
    const m: i64 = ((n as i64) ^ ((n as i64) >> 13)) * 1274126177;
    return ((m >>> 0) as f64) / 0xffffffff;
  };
};
