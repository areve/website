import { PRNG } from "./prng";

export interface MapData {
  seed: Uint8Array;
  width: number;
  height: number;
  states: Uint8Array[];
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);
export const max = (array: number[]) =>
  array.reduce((p, c) => Math.max(p, c), -Infinity);
export const min = (array: number[]) =>
  array.reduce((p, c) => Math.min(p, c), Infinity);
export const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);

export function makeMap(
  width: number,
  height: number,
  seed: Uint8Array
): MapData {
  const generator = new PRNG(seed);
  const states = generator
    .getStateArray(width * height)
    .map((v) => xor(v, seed));
  return {
    seed,
    width,
    height,
    states,
  };
}
