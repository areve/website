import { toRaw } from "vue";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const clampZeroToOne = (v: number) => clamp(v, 0, 1);

export const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);

export const max = (array: number[]) =>
  array.reduce((p, c) => Math.max(p, c), -Infinity);

export const min = (array: number[]) =>
  array.reduce((p, c) => Math.min(p, c), Infinity);

export const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);

export const seedToInt = (seed: Uint8Array) => new Uint32Array(seed.buffer)[0];

export const seedToFloat = (seed: Uint8Array) => seedToInt(seed) / 0xffffffff;

export type Rgb = [r: number, g: number, b: number];
export type Hsv = [h: number, s: number, v: number];
export function hsv2rgb(hsv: Hsv): Rgb {
  const [h, s, v] = hsv;
  const hue = (((h * 360) % 360) + 360) % 360;
  const sector = Math.floor(hue / 60);
  const sectorFloat = hue / 60 - sector;
  const x = v * (1 - s);
  const y = v * (1 - s * sectorFloat);
  const z = v * (1 - s * (1 - sectorFloat));
  const rgb = [x, x, z, v, v, y, x, x, z, v];
  return [rgb[sector + 4], rgb[sector + 2], rgb[sector]];
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value)));
}

export function cloneExtend<T>(value: T, ...sources: Partial<T>[]): T {
  return Object.assign(JSON.parse(JSON.stringify(toRaw(value))), ...sources);
}
