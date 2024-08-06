import { PRNG } from "./prng";

export interface MapData {
  integers: Uint32Array;
  states: Uint8Array[];
  state: Uint8Array;
}

export const sum = (array: Uint32Array) => array.reduce((p, c) => p + c, 0);
export const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);

export function makeMap(
  width: number,
  height: number,
  seed: Uint8Array
): MapData {
  const generator = new PRNG(seed);
  const states = generator.getStateArray(width * height);
  const integers = new Uint32Array(
    states.map((v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0)
  );
  let state = generator.getState();
  return {
    integers,
    states,
    state,
  };
}
