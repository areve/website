export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);

export const max = (array: number[]) =>
  array.reduce((p, c) => Math.max(p, c), -Infinity);

export const min = (array: number[]) =>
  array.reduce((p, c) => Math.min(p, c), Infinity);

export const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);

export const seedToInt = (seed: Uint8Array) =>
  ((seed[0] << 24) | (seed[1] << 16) | (seed[2] << 8) | seed[3]) >>> 0;

export const seedToFloat = (seed: Uint8Array) => seedToInt(seed) / 0xffffffff;

export function hsv2rgb(
  h: number,
  s: number,
  v: number
): [r: number, g: number, b: number] {
  const hue = (((h * 360) % 360) + 360) % 360;
  const sector = Math.floor(hue / 60);
  const sectorFloat = hue / 60 - sector;
  const x = v * (1 - s);
  const y = v * (1 - s * sectorFloat);
  const z = v * (1 - s * (1 - sectorFloat));
  const rgb = [x, x, z, v, v, y, x, x, z, v];
  return [rgb[sector + 4], rgb[sector + 2], rgb[sector]];
}
