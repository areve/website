import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "../noise/prng";

export const makeVoronoi2NoiseGenerator = (
  seed: number,
  dimensions: 2 | 3 = 2,
  scale: number = 16,
  density: number = 5
) => {
  const noise = makePointGeneratorFast(seed);

  const cache: any = {};
  const euclidean = (dx: number, dy: number, dz: number) =>
    dx * dx + dy * dy + dz * dz;

  return (coord: Coord): number => worley(coord.x / scale, coord.y / scale);

  function worley(ix: number, iy: number): number {
    const x = Math.floor(ix);
    const y = Math.floor(iy);
    const fx = ix - x;
    const fy = iy - y;

    const points = [
      makePoints(x, y, 0, 0, dimensions, density),
      makePoints(x, y, 1, 0, dimensions, density),
      makePoints(x, y, 0, 1, dimensions, density),
      makePoints(x, y, 1, 1, dimensions, density),
    ].flat();

    return ( 
      points.reduce(
        (p, v) => Math.min(euclidean(fx - v.x, fy - v.y, v.z ?? 0), p),
        Infinity
      ) ** 0.5 // perhaps make this optional for the caller for performance
    );
  }

  function makePoints(
    ix: number,
    iy: number,
    cx: number,
    cy: number,
    dimensions: number,
    density: number
  ) {
    const hash = `${ix}+${cx },${iy}+${cy },${dimensions},${density}`;
    // const hash = `${ix+cx },${iy+cy }`; // this hash won't work because points are relative and will be from the 0,0 point not the 1,1 or whatever
    //console.log(hash)
    if (cache[hash]) return cache[hash]

    const points = Array.from({ length: density }).map((_): Coord => {
      const h = noise(ix + cx, iy + cy) * 0xffffff;
      const x = cx + ((h & 0xff) / 0xff - 0.5);
      const y = cy + (((h >> 8) & 0xff) / 0xff - 0.5);
      const z = dimensions == 2 ? 0 : ((h >> 16) & 0xff) / 0xff - 0.5;
      return { x, y, z };
    });
    cache[hash] = points;
    return points;
  }
};
