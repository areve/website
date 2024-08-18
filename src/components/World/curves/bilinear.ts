import { Coord } from "../lib/interfaces";

export function bilinear(
  coord: Coord,
  scale: number,
  getPixel: (coord: Coord) => number
) {
  const heightScale = scale;
  const widthScale = scale;
  const x = coord.x * widthScale;
  const y = coord.y * heightScale;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const dx = x - x0;
  const dy = y - y0;
  return (
    getPixel({ x: x0, y: y0 }) * (1 - dx) * (1 - dy) +
    getPixel({ x: x0, y: y1 }) * (1 - dx) * dy +
    getPixel({ x: x1, y: y0 }) * dx * (1 - dy) +
    getPixel({ x: x1, y: y1 }) * dx * dy
  );
}
