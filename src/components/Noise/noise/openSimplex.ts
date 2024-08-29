import { makeNoiseGenerator } from "./prng";

export const makeOpenSimplexGenerator = (seed: number, scale: number = 8) => {
  const skew2d = (Math.sqrt(3) - 1) / 2;
  const unskew2d = -(3 - Math.sqrt(3)) / 6;
  const rSquared3d = 2 / 3;
  const noise = makeNoiseGenerator(seed);

  return (x: number, y: number): number => {
    const skew = (x + y) * skew2d;
    const ix = Math.floor(x + skew);
    const iy = Math.floor(y + skew);
    const fx = x + skew - ix;
    const fy = y + skew - iy;

    return (
      vertexContribution(ix, iy, fx, fy, 0, 0) +
      vertexContribution(ix, iy, fx, fy, 1, 0) +
      vertexContribution(ix, iy, fx, fy, 0, 1) +
      vertexContribution(ix, iy, fx, fy, 1, 1) +
      0.5
    );
  };

  function vertexContribution(
    ix: number,
    iy: number,
    fx: number,
    fy: number,
    cx: number,
    cy: number
  ): number {
    const dx = fx - cx;
    const dy = fy - cy;
    const skewedOffset = (dx + dy) * unskew2d;
    const dxs = dx + skewedOffset;
    const dys = dy + skewedOffset;

    const a = rSquared3d - dxs * dxs - dys * dys;
    if (a < 0) return 0;

    const h = noise(ix + cx, iy + cy) * 0xff;
    const u = (h & 0xf) - 8;
    const v = (h >> 4) - 8;
    return a * a * a * a * (u * dxs + v * dys);
  }
};
