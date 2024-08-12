import { diskFilter } from "../filters/diskFilter";
import { LayerProps, Layer, PointGenerator } from "../lib/prng";
import { SolarSystemProps } from "./solarSystemMap";

export interface PlanetProps extends LayerProps {
  weight: number;
  solarSystemProps: SolarSystemProps;
}

export interface PlanetLayer extends Layer {
  props: PlanetProps;
  heights: (x: number, y: number) => number;
}

export function makePlanetLayer(props: PlanetProps) {
  const generator = new PointGenerator(props.seed);
  const filter = diskFilter(10);
  const heights = (x: number, y: number) => {
    const padHeight = Math.floor(filter.length / 2);
    const padWidth = Math.floor(filter[0].length / 2);
    let sum = 0;
    for (let fy = 0; fy < filter.length; fy++) {
      for (let fx = 0; fx < filter[0].length; fx++) {
        const px = x + fx - padWidth;
        const py = y + fy - padHeight;
        sum += filter[fy][fx] * generator.getPoint(px, py);
      }
    }
    return (sum - 0.5) * 5 + 0.5;
  };
  const pixel = (x: number, y: number) => {
    const n = heights(x, y);
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0, n, n + 0.5];
  };
  return { props, heights, pixel } as PlanetLayer;
}
