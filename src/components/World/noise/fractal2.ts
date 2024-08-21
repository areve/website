import { Coord } from "../lib/interfaces";
import { makeOpenSimplexNoiseGenerator } from "./openSimplex";
import { makeSmoothstepAndLinearGenerator } from "./smoothstep";

export const makeFractal2NoiseGenerator = (seed: number) => {
  const noise = makeSmoothstepAndLinearGenerator(seed);

  return (coord: Coord): number => {
    const a = noise(coord, 64);
    const b = noise(coord, 32);
    const c = noise(coord, 16);
    const d = noise(coord, 8);
    const e = noise(coord, 4);
    const f = noise(coord, 2);
    const g = noise(coord, 1);
    return (a + b + c + d + e + f + g) / 7;
  };
};
