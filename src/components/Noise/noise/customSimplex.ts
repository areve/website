import { Coord } from "../lib/interfaces";
import { makePointGeneratorFast } from "./prng";

export const makeCustomSimplexGenerator = (seed: number) => {
  const fastNoise = makePointGeneratorFast(seed);

  function smootherstep(t: number): number {
    // t = Math.max(0, Math.min(1, t));
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  const smoothstep = (t: number): number => t * t * (3 - t * 2);

  const vectorsCacheSize = 256;
  const vectorsCache: Coord[] = Array.from(
    { length: vectorsCacheSize },
    (_, i) => {
      const theta = (i / vectorsCacheSize) * 2 * Math.PI;
      return { x: Math.cos(theta), y: Math.sin(theta) };
    }
  );

  const prngVector = (x: number, y: number) => {
    const theta = (fastNoise(x, y) * vectorsCacheSize) & (vectorsCacheSize - 1);
    return vectorsCache[theta];
  };

  return (coord: Coord, scale: number = 16): number => {
    // Skewing factor to transform the input space into simplex space
    const skewFactor = (coord.x + coord.y) * (Math.sqrt(3.0) - 1.0) * 0.5;

    // Skew the input coordinates
    const xSkewed = coord.x + skewFactor;
    const ySkewed = coord.y + skewFactor;

    // Determine the grid cell in the skewed space
    const x = Math.floor(xSkewed / scale);
    const y = Math.floor(ySkewed / scale);
    let fx = (xSkewed - x * scale) / scale;
    let fy = (ySkewed - y * scale) / scale;

    // Determine which simplex triangle the point is in
    const topRight = fx > fy;

    // Initialize the barycentric coordinates
    let u, v, w;
    let v0, v1, v2;
    let p0, p1, p2;

    // fx = smoothstep(fx);
    // fy = smoothstep(fy);
    if (topRight) {
      // Coordinates for bottom-left triangle
      u = 1 - fx;
      w = fy;
      v = 1 - u - w;

      // Get the gradient vectors at the corners of the triangle
      v0 = prngVector(x, y);
      v1 = prngVector(x + 1, y);
      v2 = prngVector(x + 1, y + 1);

      // Calculate the dot products
      p0 = v0.x * fx + v0.y * fy; // * (fx) + v0.y * fy;
      p1 = v1.x * (fx - 1) + v1.y * (fy); // * ((fx) - 1) + v1.y * fy;
      p2 = v2.x * (fx - 1) + v2.y* (fy - 1); // * ((fx) - 1) + v2.y * (fy - 1);
    } else {
      // return 0
      // Coordinates for top-right triangle
      u = 1 - fy;
      w = fx;
      v = 1 - u - w;

      // Get the gradient vectors at the corners of the triangle
      v0 = prngVector(x, y);
      v1 = prngVector(x, y + 1);
      v2 = prngVector(x + 1, y + 1);

      // Calculate the dot products
      p0 = v0.x * (fx)+ v0.y * fy; // * (1-fx) + v0.y * fy;
      p1 = v1.x * (fx) + v1.y * (fy-1); // * (1-fx) + v1.y * (fy - 1);
      p2 = v2.x * (fx - 1)+ v2.y * (fy - 1); // * ((1-fx) - 1) + v2.y * (fy - 1);
    }

    // Return the weighted sum of the dot products
    return smoothstep(u) * p0 + smoothstep(v) * p1 + smoothstep(w) * p2;
  };
};
