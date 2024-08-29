export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const clampZeroToOne = (v: number) => clamp(v, 0, 1);
