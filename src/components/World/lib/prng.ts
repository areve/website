export class PRNG {
    private state: Uint8Array;
  
    constructor(seed: Uint8Array) {
      if (seed.length != 16) throw new Error("seed length must be 16");
      if (this.isAllZero(seed)) throw new Error("seed must not be all zeros");
      this.state = seed.slice(0, 16);
    }
  
    isAllZero(array: Uint8Array) {
      for (let i = 0; i < array.length; ++i) {
        if (array[i]) return false;
      }
      return true;
    }
  
    preventZeroState() {
      for (let i = 0; i < 16; ++i) {
        if (++this.state[i]) break;
      }
    }
  
    shuffle() {
      let carry = 0;
      for (let i = 15; i >= 0; --i) {
        const result = this.state[(i + 15) % 16] + this.state[i] + carry;
        this.state[(i + 15) % 16] = result & 0xff;
        carry = result >> 8;
      }
      this.preventZeroState();
    }
  
    getStateArray(length: number) {
      const result: Uint8Array[] = new Array(length);
      for (let i = 0; i < result.length; i++) {
        result[i] = this.getState();
      }
      return result;
    }
  
    getState(): Uint8Array {
      this.shuffle();
      return this.state.slice(0, 16);
    }
  }