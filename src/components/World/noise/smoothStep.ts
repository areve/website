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
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const makeSmoothstepAndLinearGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  // Linear interpolation function
  const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  };

  return (coord: Coord, scale: number = 8): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x % scale) / scale; // Fractional part for x
    const fy = (coord.y % scale) / scale; // Fractional part for y

    const p0 = noise({ x, y });
    const p1 = noise({ x, y: y + 1 });
    const p2 = noise({ x: x + 1, y });
    const p3 = noise({ x: x + 1, y: y + 1 });

    const sx = (smoothstep(fx) + fx) / 2;
    const sy = (smoothstep(fy) + fy) / 2;

    // const sx = smoothstep(fx) ;
    // const sy = smoothstep(fy) ;

    // const sx = (fx) ;
    // const sy = (fy) ;

    const m1 = lerp(p0, p1, sy); // Interpolate along y-axis
    const m2 = lerp(p2, p3, sy); // Interpolate along y-axis

    return lerp(m1, m2, sx); // Interpolate along x-axis
  };
};
