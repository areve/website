export const makeLorenzAttractorGenerator = (seed: number) => {
  // Lorenz system parameters
  const sigma = 6;
  const rho = 28;
  const beta = 8 / 3;

  // Time step for integration
  const dt = 0.008;
  const maxIterations = 25;

  return (x: number, y: number): number => {
    // Initialize Lorenz system variables
    let xN = x * 0.25 - 18; // Scale and shift for better visualization
    let yN = y * 0.6 - 12;
    let zN = 0; // z is often initialized to 0

    for (let i = 0; i < maxIterations; i++) {
      // Compute derivatives
      const dx = sigma * (yN - xN);
      const dy = xN * (rho - zN) - yN;
      const dz = xN * yN - beta * zN;

      // Update variables
      xN += dx * dt;
      yN += dy * dt;
      zN += dz * dt;
    }

    // Normalize the result to be between 0 and 1
    const value = Math.abs(
      ((Math.sqrt(xN * xN + yN * yN + zN * zN) / 8) % 2) - 1
    );

    // Optional: Map to a color or intensity for visualization
    return value;
  };
};
