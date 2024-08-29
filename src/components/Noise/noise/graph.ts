import { Coord, Coord3d } from "../lib/interfaces";
import { makeOpenSimplex3dGenerator } from "./openSimplex3d";

export const makeGraphGenerator = (seed: number) => {
  const noise = makeOpenSimplex3dGenerator(seed);
  return (coord: Coord3d): number => {
    const scale = 1.2;
    let x = (coord.x / 500) * Math.PI * 2 * 8 * scale;
    let y = (coord.y / 5) * scale;
    let z = coord.z;
    const n = noise({ x, y, z }) * 2;
    let y2 = Math.sin(x + n) * 20 + n * 100 + (50 * x) / 17;

    return Math.abs(Math.cos((y2 - y) / 10));
  };
};
