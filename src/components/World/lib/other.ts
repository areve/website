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

export function applyFilter(
  pixels: number[],
  width: number,
  filter: number[][]
): number[] {
  const height = Math.floor(pixels.length / width);
  const filterHeight = filter.length;
  const filterWidth = filter[0].length;

  const padHeight = Math.floor(filterHeight / 2);
  const padWidth = Math.floor(filterWidth / 2);

  function getPixel(x: number, y: number): number {
    // Wrap around: if x or y are out of bounds, wrap them around the image
    x = (x + width) % width;
    y = (y + height) % height;
    return pixels[y * width + x];
  }

  return pixels.map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);

    // Calculate the new pixel value by applying the filter
    const sum = filter.reduce((acc, row, fy) => {
      return (
        acc +
        row.reduce((accRow, weight, fx) => {
          const imageX = x + fx - padWidth;
          const imageY = y + fy - padHeight;
          return accRow + getPixel(imageX, imageY) * weight;
        }, 0)
      );
    }, 0);

    return sum;
  });
}

export function stretchContrast(pixels: number[]): number[] {
  const minPixel = min(pixels);
  const maxPixel = max(pixels);

  return pixels.map((pixel) => {
    return (pixel - minPixel) / (maxPixel - minPixel);
  });
}
