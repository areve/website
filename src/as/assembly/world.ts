import { makeNoiseGenerator } from "./prng";

export type Fn = (x: f64, y: f64, z: f64) => u8;

let noise!: (x: f64, y: f64, z: f64, w: f64) => number;
export const makeWorldGenerator = (seed: i64): Fn => {
  noise = makeNoiseGenerator(seed);
  return (x: f64, y: f64, z: f64): u8 => {
    return <u8><i64>(noise(x, y, z, 0) * 0xff)
  };
};
