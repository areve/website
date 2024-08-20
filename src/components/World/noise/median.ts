import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

export const makeMedianGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord): number => {
    const x = coord.x;
    const y = coord.y;

    // Array to hold the noise values for the 5x5 grid
    const values: number[] = [];

    const k = 1
    // Iterate over the 3x3 grid
    for (let i = -k; i <= k; i++) {
      for (let j = -k; j <= k; j++) {
        values.push(noise({ x: x + i, y: y + j }));
      }
    }

    // Sort the values to find the median
    values.sort((a, b) => a - b);

    // Return the median value (the middle value in a 25-element array)
    return values[Math.floor(values.length / 2)];
  };
};