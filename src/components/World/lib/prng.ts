import { seedToInt, xor } from "./other";

export interface LayerProps {
  seed: number;
  width: number;
  height: number;
}


export interface Layer {
  props: LayerProps;
  pixel: (x: number, y: number) => number[];
}

function prng2DWithSeed(x: number, y: number, seed: number): number {
  // Combine the coordinates with the seed
  const combinedSeed = seed + x * 374761393 + y * 668265263; // Use large primes to reduce collisions
  const mixedSeed = (combinedSeed ^ (combinedSeed >> 13)) * 1274126177;

  // Convert the mixedSeed into a pseudo-random number in the range [0, 1)
  const result = ((mixedSeed ^ (mixedSeed >> 16)) >>> 0) / 4294967296;

  return result;
}

export class PointGenerator {
  private seed: number;
  constructor(seed: number) {
    const n = new Uint32Array(new Float64Array([seed]).buffer);
    this.seed = n[0] ^ n[1];
  }

  getPoint(x: number, y: number): number {
    const n = this.seed + x * 374761393 + y * 668265263;
    const m = (n ^ (n >> 13)) * 1274126177;
    return (m >>> 0) / 0xffffffff;
  }
}

export function getStates(seed: Uint8Array, count: number) {
  const width = Math.sqrt(count);
  const n = seedToInt(seed);
  const r = new Array(count).fill(0).map((_, i) => {
    const r = prng2DWithSeed(Math.floor(i / width), i % width, n) * 0xffffffff;

    return new Uint8Array(new Uint32Array([r, r, r, r]).buffer);
  });

  return r;
}
