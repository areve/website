export const makeMandelbrotGenerator = (seed: number) => {
  return (x: number, y: number): number => {
    const r0 = x / 300 - 2;
    const i0 = y / 300 - 0.05;
    const maxIterations = 40;

    let r = 0;
    let i = 0;
    let iteration = 0;

    while (r * r + i * i <= 4 && iteration < maxIterations) {
      const rTemp = r * r - i * i + r0;
      i = 2 * r * i + i0;
      r = rTemp;
      ++iteration;
    }

    return iteration / maxIterations;
  };
};

export const makeJuliaGenerator = (seed: number) => {
  const cRe = 0.355; // Real part of the constant c
  const cIm = 0.355; // Imaginary part of the constant c
  const maxIterations = 150;

  return (x: number, y: number) => {
    const r0 = x / 300 - 1;
    const i0 = y / 300 - 1;

    let r = r0;
    let i = i0;
    let iteration = 0;

    while (r * r + i * i <= 4 && iteration < maxIterations) {
      const rTemp = r * r - i * i + cRe;
      i = 2 * r * i + cIm;
      r = rTemp;
      ++iteration;
    }

    return { iteration, maxIterations, r, i, x, y, r0, i0 };
  };
};
