import { Coord, Dimensions } from "./interfaces";

function cubicInterpolate(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  return (
    p1 +
    0.5 *
      t *
      (p2 -
        p0 +
        t *
          (2.0 * p0 -
            5.0 * p1 +
            4.0 * p2 -
            p3 +
            t * (3.0 * (p1 - p2) + p3 - p0)))
  );
}

export function bicubic(
  coord: Coord,
  scale: number,
  getPixel: (coord: Coord) => number
): number {
  const x = coord.x * scale;
  const y = coord.y * scale;
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;
  const dx = x - (x0 + 1);
  const dy = y - (y0 + 1);
  const colValues = [];
  for (let i = 0; i < 4; i++) {
    colValues.push(
      cubicInterpolate(
        getPixel({ x: x0 + 0, y: y0 + i }),
        getPixel({ x: x0 + 1, y: y0 + i }),
        getPixel({ x: x0 + 2, y: y0 + i }),
        getPixel({ x: x0 + 3, y: y0 + i }),
        dx)
    );
  }
  return cubicInterpolate(
    colValues[0],
    colValues[1],
    colValues[2],
    colValues[3],
    dy
  );
}