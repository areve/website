import { Coord } from "../lib/interfaces";

export const makeLorenzAttractorGenerator = (seed: number) => {
  // Lorenz system parameters
  const sigma = 6;
  const rho = 28;
  const beta = 8 / 3;

  // Time step for integration
  const dt = 0.008;
  const maxIterations = 25;

  return (coord: Coord): number => {
    // Initialize Lorenz system variables
    let x = coord.x * 0.25 - 18; // Scale and shift for better visualization
    let y = coord.y * 0.6 - 12;
    let z = 0; // z is often initialized to 0

    for (let i = 0; i < maxIterations; i++) {
      // Compute derivatives
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      // Update variables
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
    }

    // Normalize the result to be between 0 and 1
    const value = Math.abs(Math.sqrt(x * x + y * y + z * z) / 8 % 2 - 1);

    // Optional: Map to a color or intensity for visualization
    return value;
  };
};
