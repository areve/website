import { makeOpenSimplex3dGenerator } from "./openSimplex";

export const makeGraphGenerator = (seed: number) => {
  const noise = makeOpenSimplex3dGenerator(seed);
  return (x: number, y: number, z: number): number => {
    const scale = 1.2;
    let x1 = (x / 500) * Math.PI * 2 * 8 * scale;
    let y1 = (y / 5) * scale;
    let z1 = z;
    const n = noise(x1, y1, z1) * 2;
    let y2 = Math.sin(x1 + n) * 20 + n * 100 + (50 * x1) / 17;

    return Math.abs(Math.cos((y2 - y1) / 10));
  };
};
