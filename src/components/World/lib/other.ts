import { PRNG } from "./prng";

export interface MapData {
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
  let state = generator.getState();
  const states = generator.getStateArray(width * height);
  
  return {
    states,
    state,
  };
}
