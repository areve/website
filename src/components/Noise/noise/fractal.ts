import { makeOpenSimplex3dGenerator } from "./openSimplex";

export const makeFractalNoiseGenerator = (seed: number) => {
  const openSimplex1 = makeOpenSimplex3dGenerator(seed, 32);
  const openSimplex2 = makeOpenSimplex3dGenerator(seed * 24922949, 16);
  const openSimplex3 = makeOpenSimplex3dGenerator(seed * 50950349, 8);
  const openSimplex4 = makeOpenSimplex3dGenerator(seed * 73150993, 4);
  return (x: number, y: number, z: number): number => {
    return (
      0.4 * openSimplex1(x, y, z) +
      0.3 * openSimplex2(x, y, z) +
      0.2 * openSimplex3(x, y, z) +
      0.1 * openSimplex4(x, y, z)
    );
  };
};
