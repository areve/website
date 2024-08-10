export function applyFilter(
  pixels: number[],
  width: number,
  height: number,
  filter: number[][]
): number[] {
  const padHeight = Math.floor(filter.length / 2);
  const padWidth = Math.floor(filter[0].length / 2);

  return pixels.map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const getPixel = (fx: number, fy: number) =>
      pixels[
        ((y + fy - padHeight + height) % height) * width +
          ((x + fx - padWidth + width) % width)
      ];

    return filter.reduce(
      (acc, row, fy) =>
        acc + row.reduce((acc, fv, fx) => acc + fv * getPixel(fx, fy), 0),
      0
    );
  });
}
