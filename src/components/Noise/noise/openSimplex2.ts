import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

export const makeOpenSimplex2Generator = (seed: number) => {
  const noise = makePointGenerator(seed);

  const smoothstep = (t: number): number => t * t * (3 - t * 2);

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  function barycentricInterp(
    p0: number,
    p1: number,
    p2: number, // Values at the three triangle vertices
    u: number,
    v: number // Barycentric coordinates u and v
  ): number {
    const w = 1 - u - v; // Barycentric coordinate w

    // Return the weighted sum of the three points
    return p0 * w + p1 * u + p2 * v;
  }

  const prngVector = (coord: Coord) => {
    const theta = noise({ x: coord.x, y: coord.y, z: 1 }) * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  };

  return (coord: Coord, scale: number = 8): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x % scale) / scale;
    const fy = (coord.y % scale) / scale;

    const p3 = noise({ x: x + 1, y: y + 1 });

    let r: number;
    if (fx + fy < 1) {
      const p0 = noise({ x, y });
      const p1 = noise({ x, y: y + 1 });
      const p2 = noise({ x: x + 1, y });
      const v = fy;
      const w = fx;
      const u = 1 - v - w;
      return p0 * u + p1 * v + p2 * w;
    } else {
      const p1 = noise({ x, y: y + 1 });
      const p2 = noise({ x: x + 1, y });
      const p3 = noise({ x: x + 1, y: y + 1 });
      const v = 1 - fx;
      const w = 1 - fy;
      const u = 1 - v - w;
      return p3 * u + p1 * v + p2 * w;
    }
  };
};
