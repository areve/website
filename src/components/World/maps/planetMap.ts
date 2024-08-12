import { diskFilter } from "../filters/diskFilter";
import { stretchContrast } from "../lib/stretchContrast";
import { applyFilter } from "../lib/applyFilter";
import { LayerProps, Layer, PointGenerator } from "../lib/prng";
import { SolarSystemProps } from "./solarSystemMap";

export interface PlanetProps extends LayerProps {
  weight: number;
  solarSystemProps: SolarSystemProps;
}

export interface PlanetLayer extends Layer {
  props: PlanetProps;
}

export function makePlanetLayer(props: PlanetProps) {
  const generator = new PointGenerator(props.seed);
  const scale = props.weight / props.height / props.width;
  const data: number[][] = new Array(props.height) //
    .fill(0)
    .map((_, x) =>
      new Array(props.width) //
        .fill(0)
        .map((_, y) => generator.getPoint(x, y))
    );
  const filter = diskFilter(10);
  const blurred = applyFilter(data, filter);
  const heights = stretchContrast(blurred);
  const pixel = (x: number, y: number) => {
    const n = heights[y][x];
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0, n, n + 0.5];
  };
  return { props, pixel } as PlanetLayer;
}
