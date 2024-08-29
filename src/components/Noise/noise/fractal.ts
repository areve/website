import { Coord3d } from "../lib/interfaces";
import { makeOpenSimplex3dGenerator } from "./openSimplex3d";

export const makeFractalNoiseGenerator = (seed: number) => {
  const openSimplex1 = makeOpenSimplex3dGenerator(seed, 32);
  const openSimplex2 = makeOpenSimplex3dGenerator(seed * 24922949, 16);
  const openSimplex3 = makeOpenSimplex3dGenerator(seed * 50950349, 8);
  const openSimplex4 = makeOpenSimplex3dGenerator(seed * 73150993, 4);
  return (coord: Coord3d): number => {
    return (
      0.4 * openSimplex1(coord) +
      0.3 * openSimplex2(coord) +
      0.2 * openSimplex3(coord) +
      0.1 * openSimplex4(coord)
    );
  };
};
