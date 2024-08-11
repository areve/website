import { xor } from "./other";

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
    const lenMinus1 = state.length - 1;
    for (let i = lenMinus1; i >= 0; --i) {
      const result = state[(i + lenMinus1) % len] + state[i] + carry;
      state[(i + lenMinus1) % len] = result & 0xff;
      carry = result >> 8;
    }
    this.preventZeroState();
    return this._state;
  };

  state = () => this.next().slice(0, 16);
  float32 = () => new Float32Array(this.next().buffer)[0];
  float64 = () => new Float64Array(this.next().buffer)[0];
}

export function getStates(seed: Uint8Array, count: number) {
  const generator = new PRNG(seed);
  const states = new Array(count).fill(0).map(generator.state);
  const state = generator.state();
  return states.map((v) => xor(v, state));
}
