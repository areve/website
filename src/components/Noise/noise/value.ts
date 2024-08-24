import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const smoothstep = (t: number): number => {
  return t * t * (3 - t * 2);
};

const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const makeValueNoiseGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord, scale: number = 8): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);  
    const fx = (coord.x % scale) / scale;
    const fy = (coord.y % scale) / scale;

    const p0 = noise({ x, y });
    const p1 = noise({ x, y: y + 1 });
    const p2 = noise({ x: x + 1, y });
    const p3 = noise({ x: x + 1, y: y + 1 });

    const sx = smoothstep(fx);
    const sy = smoothstep(fy);
    const m1 = lerp(p0, p1, sy);
    const m2 = lerp(p2, p3, sy);
    return lerp(m1, m2, sx);
  };
};
