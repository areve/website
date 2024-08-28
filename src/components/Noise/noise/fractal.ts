import { Coord } from "../lib/interfaces";
import { makeOpenSimplexGenerator } from "./openSimplex";

export const makeFractalNoiseGenerator = (seed: number) => {
  const openSimplex1 = makeOpenSimplexGenerator(seed, 32);
  const openSimplex2 = makeOpenSimplexGenerator(seed * 24922949, 16);
  const openSimplex3 = makeOpenSimplexGenerator(seed * 50950349, 8);
  const openSimplex4 = makeOpenSimplexGenerator(seed * 73150993, 4);
  return (coord: Coord): number => {
    return (
      0.4 * openSimplex1(coord) +
      0.3 * openSimplex2(coord) +
      0.2 * openSimplex3(coord) +
      0.1 * openSimplex4(coord)
    );
  };
};
