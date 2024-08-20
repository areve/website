import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

function smootherstep(t: number): number {
  // Clamp t to the range [0, 1]
  t = Math.max(0, Math.min(1, t));
  // Apply the smoothstep function
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Smoothstep function
const smoothstep = (t: number): number => {
  return t * t * (3 - 2 * t);
};


export const makeSmoothstepGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  // Linear interpolation function
  const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  };

  return (coord: Coord): number => {
    const x = Math.floor(coord.x / 16);
    const y = Math.floor(coord.y / 16);
    const fx = (coord.x % 16) / 16; // Fractional part for x
    const fy = (coord.y % 16) / 16; // Fractional part for y

    const p0 = noise({ x, y });
    const p1 = noise({ x, y: y + 1 });
    const p2 = noise({ x: x + 1, y });
    const p3 = noise({ x: x + 1, y: y + 1 });

    const sx = smoothstep(fx); // Apply smoothstep to fractional part of x
    const sy = smoothstep(fy); // Apply smoothstep to fractional part of y

    const m1 = lerp(p0, p1, sy); // Interpolate along y-axis
    const m2 = lerp(p2, p3, sy); // Interpolate along y-axis

    return lerp(m1, m2, sx); // Interpolate along x-axis
  };
};
