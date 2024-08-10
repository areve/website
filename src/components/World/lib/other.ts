import { PRNG } from "./prng";

export interface LayerProps {
  seed: Uint8Array;
  width: number;
  height: number;
}

export interface Layer {
  props: LayerProps;
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

export const seedToInt = (seed: Uint8Array) =>
  ((seed[0] << 24) | (seed[1] << 16) | (seed[2] << 8) | seed[3]) >>> 0;

export function getStates(props: LayerProps) {
  const generator = new PRNG(props.seed);
  return generator.getStateArray(props.width * props.height);
}

export function render(
  context: CanvasRenderingContext2D | null,
  pixels: number[][]
) {
  if (!context) return;
  const imageData = new ImageData(context.canvas.width, context.canvas.height);
  imageData.data.forEach((_, i, a) => {
    const v = pixels[(i / 4) >> 0][i % 4];
    a[i] = (v ?? 1) * 255;
  });
  context.putImageData(imageData, 0, 0);
}
