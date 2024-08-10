import { min, max } from "./other";


export function stretchContrast(pixels: number[]): number[] {
  const minPixel = min(pixels);
  const maxPixel = max(pixels);

  return pixels.map((pixel) => {
    return (pixel - minPixel) / (maxPixel - minPixel);
  });
}
