export function applyFilter(
  pixels: number[][], // 2D array of pixels
  filter: number[][]  // 2D filter matrix
): number[][] {
  const height = pixels.length;
  const width = pixels[0].length;

  const padHeight = Math.floor(filter.length / 2);
  const padWidth = Math.floor(filter[0].length / 2);

  // Initialize output array
  const output: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;

      for (let fy = 0; fy < filter.length; fy++) {
        for (let fx = 0; fx < filter[0].length; fx++) {
          const px = x + fx - padWidth;
          const py = y + fy - padHeight;

          // Get pixel value with wrapping around (circular boundary conditions)
          const wrappedX = (px + width) % width;
          const wrappedY = (py + height) % height;

          sum += filter[fy][fx] * pixels[wrappedY][wrappedX];
        }
      }

      output[y][x] = sum;
    }
  }

  return output;
}
