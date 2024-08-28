import { Coord } from "../lib/interfaces";
import { makeOpenSimplexGenerator } from "./openSimplex";

export const makeGraphGenerator = (seed: number) => {
  const noise = makeOpenSimplexGenerator(seed);
  return (coord: Coord): number => {
    const scale = 1.2;
    let x = (coord.x / 500) * Math.PI * 2 * 8 * scale;
    let y = (coord.y / 5) * scale;
    const n = noise({ x, y }) * 2;

    let y2 = Math.sin(x + n) * 20 + n * 100 + (50 * x) / 17;

    return Math.abs(Math.cos((y2 - y) / 10));
  };
};
