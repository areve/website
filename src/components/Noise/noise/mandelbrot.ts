import { Coord } from "../lib/interfaces";

export const makeMandelbrotGenerator = (seed: number) => {
  return (coord: Coord): number => {
    const r0 = coord.x / 300 - 2;
    const i0 = coord.y / 300 - 0.05;
    const maxIterations = 30;

    let r = 0;
    let i = 0;
    let iteration = 0;

    while (r * r + i * i <= 4 && iteration < maxIterations) {
      const rTemp = r * r - i * i + r0;
      i = 2 * r * i + i0;
      r = rTemp;
      ++iteration;
    }
    
    return iteration / maxIterations;
  };
};
