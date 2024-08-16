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
  dimensions: Dimensions,
  scale: number,
  getPixel: (coord: Coord) => number
): number {
  const heightScale = scale;
  const widthScale = scale;

  const oldWidth = dimensions.width;
  const oldHeight = dimensions.height;

  // Find the position in the input array
  const x = coord.x * widthScale;
  const y = coord.y * heightScale;

  // Calculate the top-left corner of the 4x4 grid of surrounding pixels
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;

  // Calculate the differences (fractions within the grid cell)
  const dx = x - (x0 + 1);
  const dy = y - (y0 + 1);

  // Fetch the 4x4 grid of surrounding points
  const grid: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const row: number[] = [];
    for (let j = 0; j < 4; j++) {
      row.push(getPixel({ x: x0 + j, y: y0 + i }));
    }
    grid.push(row);
  }

  // Perform bicubic interpolation on the grid
  const colValues = [];
  for (let i = 0; i < 4; i++) {
    colValues.push(
      cubicInterpolate(grid[i][0], grid[i][1], grid[i][2], grid[i][3], dx)
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
