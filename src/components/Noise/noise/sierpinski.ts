import { Coord } from "../lib/interfaces";

export const makeSierpinskiGenerator = (seed: number) => {
  return (coord: Coord): number => {
    let x = coord.x;
    let y = coord.y;

    let inside = true;
    while (x > 0 || y > 0) {
      if ((x % 2 === 1) && (y % 2 === 1)) {
        inside = false;
        break;
      }
      x = Math.floor(x / 2);
      y = Math.floor(y / 2);
    }

    return inside ? 1 : 0;
  };
};
