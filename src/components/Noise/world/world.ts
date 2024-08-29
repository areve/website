import { hsv2rgb } from "../lib/color";
import { makeOpenSimplex3dGenerator } from "../noise/openSimplex";

export const makeWorld = (seed: number) => {
  const makeWorldGenerator = (seed: number) => {
    const noise = makeOpenSimplex3dGenerator(seed);
    return (x: number, y: number, z: number): number => {
      const scale = 0.5;
      let x1 = (x / 500) * Math.PI * 2 * 8 * scale;
      let y1 = (y / 5) * scale;
      let z1 = z;
      const n = noise(x1, y1, z1) * 2;
      let y2 = Math.sin(x1 + n) * 20 + n * 100 + (50 * x1) / 17;

      return Math.abs(Math.cos((y2 - y1) / 10));
    };
  };

  const generator = makeWorldGenerator(seed);

  const pixel = (x: number, y: number) => {
    const n = generator(x, y, world.frame / 10);
    return hsv2rgb([n + (world.frame % 100) / 100, 1, 1]);
  };

  const world = {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "World",
    pixel,
    frame: 0,
    selected: false,
  };

  return world;
};
