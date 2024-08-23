import { Coord } from "../lib/interfaces";
import { makePointGenerator } from "./prng";

const euclidean = (dx: number, dy: number, dz: number) =>
  dx * dx + dy * dy + dz * dz;

export const makeStarfieldGenerator = (seed: number) => {
  const noise = makePointGenerator(seed);

  return (coord: Coord): number => {
    const s = 8; //this.size;
    const d = 9; //this.density;
    const offsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const anchors = offsets.map((v) => ({
      x: (Math.floor(coord.x / s) + v.x) * s,
      y: (Math.floor(coord.y / s) + v.y) * s,
    }));
    const points = anchors.flatMap((anchor: Coord) =>
      Array.from({ length: d }).map(
        (_, i): Coord => ({
          x: anchor.x + (noise({ ...anchor, z: i }) - 0.5) * s,
          y: anchor.y + (noise({ ...anchor, w: i }) - 0.5) * s,
          z: (noise({ ...anchor, z: i, w: i }) - 0.5) * s,
        })
      )
    );

    return (
      (1 -
        Math.sqrt(
          points.reduce(
            (p, v) =>
              Math.min(euclidean(coord.x - v.x, coord.y - v.y, v.z ?? 0), p),
            Infinity
          )
        ) /
          s) **
      16
    );
  };
};
