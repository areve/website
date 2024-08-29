import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makePerlinGenerator = (seed: number, scale: number = 8) => {
  const noise = makePointGeneratorFast(seed);

  const smootherstep = (t: number): number =>
    t * t * t * (t * (t * 6 - 15) + 10);

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const prngVector = (coord: Coord) => {
    const theta = noise(coord.x, coord.y, 1) * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  };

  return (coord: Coord): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x / scale) - x;
    const fy = (coord.y / scale) - y;

    const v0 = prngVector({ x, y });
    const v1 = prngVector({ x, y: y + 1 });
    const v2 = prngVector({ x: x + 1, y });
    const v3 = prngVector({ x: x + 1, y: y + 1 });

    // Calculate the dot products
    const dot0 = v0.x * fx + v0.y * fy;
    const dot1 = v1.x * fx + v1.y * (fy - 1);
    const dot2 = v2.x * (fx - 1) + v2.y * fy;
    const dot3 = v3.x * (fx - 1) + v3.y * (fy - 1);

    // Interpolate between the dot products
    const sx = smootherstep(fx);
    const sy = smootherstep(fy);
    const m1 = lerp(dot0, dot1, sy);
    const m2 = lerp(dot2, dot3, sy);
    return lerp(m1, m2, sx) * 0.5 + 0.5;
  };
};
