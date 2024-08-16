import { Coord, Dimensions } from "./interfaces";

export function bilinear(
  coord: Coord,
  dimensions: Dimensions,
  scale: number,
  getPixel: (coord: Coord) => number
) {
  const heightScale = scale;
  const widthScale = scale;

  const oldWidth = dimensions.width;
  const oldHeight = dimensions.height;

  // Find the position in the input array
  const x = coord.x * widthScale;
  const y = coord.y * heightScale;

  // Calculate the coordinates of the surrounding pixels
  const x0 = Math.floor(x);
  const x1 = Math.min(x0 + 1, oldHeight - 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(y0 + 1, oldWidth - 1);

  // Calculate the differences
  const dx = x - x0;
  const dy = y - y0;

  // Perform bilinear interpolation
  return (
    getPixel({ x: x0, y: y0 }) * (1 - dx) * (1 - dy) +
    getPixel({ x: x0, y: y1 }) * (1 - dx) * dy +
    getPixel({ x: x1, y: y0 }) * dx * (1 - dy) +
    getPixel({ x: x1, y: y1 }) * dx * dy
  );
}
