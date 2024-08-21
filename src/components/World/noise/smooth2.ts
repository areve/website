import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

const smoothstep = (t: number): number => {
  return t * t * 3 - t * t * t * 2;
};

const notSoSmoothStep =(t: number, weight: number) =>{
    return  t * t * (3 - 2 * t)
}

const pseudoRandomNormal = (v: number) => {
  const r = v * 3349393199;
  const n = (((r ^ (r >> 13)) * 2745088117) >> 0) / 0xffffffff;
  return n;
};

// const adjustedT = (1 - w) * x + w * x * x * (3 - 2 * x);

console.log(0.1456, pseudoRandomNormal(0.1456));
console.log(0.2, pseudoRandomNormal(0.2));
console.log(0.777, pseudoRandomNormal(0.777));
console.log(1, pseudoRandomNormal(1));
console.log(1.1, pseudoRandomNormal(1.1));
console.log(2, pseudoRandomNormal(2));
console.log(3, pseudoRandomNormal(3));
console.log(4.5, pseudoRandomNormal(4.5));
export const makeSmooth2NoiseGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  // Linear interpolation function
  const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  };

  function lerpWithGamma(t: number, a: number, b: number, gamma: number): number {
    // Ensure t is between 0 and 1
    t = Math.max(0, Math.min(1, t));

    // Apply gamma correction to the interpolation factor
    const correctedT = Math.pow(t, gamma);

    // Perform the linear interpolation with the corrected factor
    return a +  (b - a) * correctedT;
}
  return (coord: Coord, scale: number = 32): number => {
    const x = Math.floor(coord.x / scale);
    const y = Math.floor(coord.y / scale);
    const fx = (coord.x % scale) / scale; // Fractional part for x
    const fy = (coord.y % scale) / scale; // Fractional part for y

    const p0 = noise({ x, y });
    const p1 = noise({ x, y: y + 1 });
    const p2 = noise({ x: x + 1, y });
    const p3 = noise({ x: x + 1, y: y + 1 });

    const n0 = pseudoRandomNormal(p0);
    const n1 = pseudoRandomNormal(p1);
    const n2 = pseudoRandomNormal(p2);
    const n3 = pseudoRandomNormal(p3);
// console.log(n0)
    const m1w =  (n0 / n1);
    const m2w = (n2 / n3);
    const m3w = m1w / m2w;

    // console.log(m1w, n0, n1)
    const sx = notSoSmoothStep(fx, m3w);
    const sy1 = notSoSmoothStep(fy, m1w)
    const sy2 = notSoSmoothStep(fy, m2w);

    const m1 = lerp(p0, p1, sy1); 
    const m2 = lerp(p2, p3, sy2); 

    return lerp(m1, m2, sx); 
  };
};
