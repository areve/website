function preventZeroState(state: Uint8Array) {
  for (let i = 0; i < state.length; ++i) {
    if (++state[i]) break;
  }
}

function shuffle(state: Uint8Array) {
  let carry = 0;
  const len = state.length;
  const lenMinus1 = state.length - 1;
  for (let i = lenMinus1; i >= 0; --i) {
    const result = state[(i + lenMinus1) % len] + state[i] + carry;
    state[(i + lenMinus1) % len] = result & 0xff;
    carry = result >> 8;
  }
  preventZeroState(state);
}

function isAllZero(state: Uint8Array) {
  for (let i = 0; i < state.length; ++i) {
    if (state[i]) return false;
  }
  return true;
}

export class PRNG {
  private state: Uint8Array;

  constructor(seed: Uint8Array) {
    if (seed.length != 16) throw new Error("seed length must be 16");
    if (isAllZero(seed)) throw new Error("seed must not be all zeros");
    this.state = seed.slice(0, 16);
  }

  getStateArray(length: number) {
    const result: Uint8Array[] = new Array(length);
    for (let i = 0; i < result.length; i++) {
      result[i] = this.getState();
    }
    return result;
  }

  getState(): Uint8Array {
    shuffle(this.state);
    return this.state.slice(0, 16);
  }
}
