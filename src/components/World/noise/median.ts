import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";


export const makeMedianGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord): number => {
    const x = coord.x;
    const y = coord.y;

    const k = 1 // 1 is correct but 2 looks interesting
    // Get noise values at the 3x3 grid around (x, y)
    const p0 = noise({ x: x - k, y: y - k });
    const p1 = noise({ x, y: y - k });
    const p2 = noise({ x: x + k, y: y - k });

    const p3 = noise({ x: x - k, y });
    const p4 = noise({ x, y });
    const p5 = noise({ x: x + k, y });

    const p6 = noise({ x: x - k, y: y + k });
    const p7 = noise({ x, y: y + k });
    const p8 = noise({ x: x + k, y: y + k });

    // Calculate the median of the nine points
    const values = [p0, p1, p2, p3, p4, p5, p6, p7, p8].sort((a, b) => a - b);

    // Return the median value
    return values[Math.floor(values.length / 2)];
  };
};