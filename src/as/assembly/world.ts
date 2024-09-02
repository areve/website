import { OpenSimplex2dGenerator, OpenSimplex3dGenerator, makeOpenSimplex2dGenerator, makeOpenSimplex3dGenerator } from "./openSimplex";
import { NoiseGenerator, makeNoiseGenerator } from "./prng";

export type Fn = (x: f64, y: f64, z: f64) => u8;

let noise!: NoiseGenerator;
let noise2!: OpenSimplex2dGenerator;
let noise3!: OpenSimplex3dGenerator;
export const makeWorldGenerator = (seed: i64): Fn => {
  noise = makeNoiseGenerator(seed);
  noise2 = makeOpenSimplex2dGenerator(seed);
  noise3 = makeOpenSimplex3dGenerator(seed);
  return (x: f64, y: f64, z: f64): u8 => {
    // return <u8><i64>(noise(x, y, z, 0) * 0xff)
    return <u8><i64>(noise3(x, y, z) * 0xff)
  };
};
