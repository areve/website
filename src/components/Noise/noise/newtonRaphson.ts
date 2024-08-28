import { Coord } from "../lib/interfaces";

export const makeNewtonRaphsonGenerator = (seed: number) => {
  return (coord: Coord): number => {
    const maxIterations = 50;
    const tolerance = 1e-6;
    const cReal = coord.x / 200 - 2; // Adjusting for better viewing
    const cImag = coord.y / 200 - 0.25; // Adjusting for better viewing

    let x = cReal;
    let y = cImag;
    let iteration = 0;

    // Polynomial: z^3 - 1 = 0
    const polynomialAndDerivatives = (zReal: number, zImag: number) => {
      const zReal3 = zReal * zReal * zReal;
      const zImag3 = zImag * zImag * zImag;
      const zReal2 = zReal * zReal;
      const zImag2 = zImag * zImag;

      // Polynomial P(z) = z^3 - 1
      const pReal = zReal3 - 3 * zReal * zImag2 - 1;
      const pImag = 3 * zReal2 * zImag - zImag3;

      // Derivative P'(z) = 3z^2
      const dReal = 3 * (zReal2 - zImag2);
      const dImag = 6 * zReal * zImag;

      return { pReal, pImag, dReal, dImag };
    };

    while (iteration < maxIterations) {
      const { pReal, pImag, dReal, dImag } = polynomialAndDerivatives(x, y);

      const denom = dReal * dReal + dImag * dImag;
      if (denom === 0) break;

      const xNew = x - (pReal * dReal + pImag * dImag) / denom;
      const yNew = y - (pImag * dReal - pReal * dImag) / denom;

      if (Math.abs(xNew - x) < tolerance && Math.abs(yNew - y) < tolerance) {
        break;
      }

      x = xNew;
      y = yNew;
      iteration++;
    }

    // Normalize the output
    return iteration / maxIterations;
  };
};