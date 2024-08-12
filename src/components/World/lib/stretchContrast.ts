import { min, max } from "./other";


export function stretchContrast(pixels: number[][]): number[][] {
  // Flatten the 2D array to find min and max pixel values
  const flattenedPixels = pixels.flat();
  const minPixel = Math.min(...flattenedPixels);
  const maxPixel = Math.max(...flattenedPixels);

  // Avoid division by zero if all pixel values are the same
  const range = maxPixel - minPixel;
  if (range === 0) {
    return pixels.map(row => row.map(() => 0));
  }

  // Stretch contrast for each pixel in the 2D array
  return pixels.map(row => 
    row.map(pixel => (pixel - minPixel) / range)
  );
}