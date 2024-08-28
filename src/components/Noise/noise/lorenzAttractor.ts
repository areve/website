import { Coord } from "../lib/interfaces";

export const makeLorenzAttractorGenerator = (seed: number) => {
  // Lorenz system parameters
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;

  // Time step for integration
  const dt = 0.01;
  const maxIterations = 80;

  return (coord: Coord): number => {
    // Initialize Lorenz system variables
    let x = coord.x * 0.2 - 10; // Scale and shift for better visualization
    let y = coord.y * 0.3 - 10;
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
    const value = (Math.sqrt(x * x + y * y + z * z) / 10 % 1);

    // Optional: Map to a color or intensity for visualization
    return value;
  };
};
