import { seedToInt, xor } from "./other";

export interface LayerProps {
  seed: Uint8Array;
  width: number;
  height: number;
}

export interface Layer {
  props: LayerProps;
  states: Uint8Array[];
}

class PRNG {
  private _state: Uint8Array;

  constructor(seed: Uint8Array | number) {
    this._state =
      typeof seed === "number" //
        ? new Uint8Array(
            new BigUint64Array([BigInt(seed), BigInt(seed)]).buffer
          )
        : seed.slice(0, 16);
    if (this._state.length != 16) throw new Error("seed length must be 16");
    if (this.isAllZero()) throw new Error("seed must not be all zeros");
  }

  private isAllZero = () =>
    this._state.reduce<boolean>((p, v) => p && v === 0, true);

  private preventZeroState = () => {
    for (let i = 0, max = this._state.length; i < max; ++i)
      if (++this._state[i]) return;
  };

  private next = () => {
    let carry = 0;
    const state = this._state;
    const len = state.length;
    const lenMinus1 = len - 1;
    for (let i = lenMinus1; i >= 0; --i) {
      const result = state[(i + lenMinus1) % len] + state[i] + carry;
      state[(i + lenMinus1) % len] = result & 0xff;
      carry = result >> 8;
    }
    this.preventZeroState();
    return state;
  };

  state = () => this.next().slice(0, 16);
  int = () => new Int32Array(this.next().buffer)[0];
}

export function getStates_(seed: Uint8Array, count: number) {
  const generator = new PRNG(seed);
  const states = new Array(count).fill(0).map(generator.state);
  const state = generator.state();
  return states.map((v) => xor(v, state));
}

function prng2DWithSeed(x: number, y: number, seed: number): number {
  // Combine the coordinates with the seed
  const combinedSeed = seed + x * 374761393 + y * 668265263; // Use large primes to reduce collisions
  const mixedSeed = (combinedSeed ^ (combinedSeed >> 13)) * 1274126177;

  // Convert the mixedSeed into a pseudo-random number in the range [0, 1)
  const result = ((mixedSeed ^ (mixedSeed >> 16)) >>> 0) / 4294967296;

  return result;
}

export function getStates(seed: Uint8Array, count: number) {
  const width = Math.sqrt(count);
  const n = seedToInt(seed);
  // const height = Math.sqrt(count);
  // const foo = (i: number) => {};
  const r =  new Array(count).fill(0).map((_, i) => {
    const r = prng2DWithSeed(Math.floor(i / width), i % width, n) * 0xffffffff;
    
    return new Uint32Array([r, r, r, r]);
  });
 // console.log(width, r)
  return r
  // const generator = new PRNG(seed);
  // const states = new Array(count).fill(0).map(generator.state);
  // const state = generator.state();
  // return states.map((v) => xor(v, state));
}

// console.log(prng2D(1, 2)); // Consistently returns the same value for (1, 2)
// console.log(prng2D(3, 4)); // Consistently returns the same value for (3, 4)
// console.log(prng2D(3, 5)); // Consistently returns the same value for (3, 4)

