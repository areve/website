import { diskFilter } from "../filters/diskFilter";
import {
  Layer,
  LayerProps,
  applyFilter,
  getStates,
  seedToFloat,
  stretchContrast,
} from "../lib/other";
import { SolarSystemProps } from "./solarSystemMap";

export interface PlanetProps extends LayerProps {
  weight: number;
  solarSystemProps: SolarSystemProps;
}

export interface PlanetLayer extends Layer {
  props: PlanetProps;
  heights: number[];
}

export function makePlanetLayer(props: PlanetProps) {
  const states = getStates(props);
  const floats = states.map(seedToFloat);
  const heights = getHeights(props.width, floats);
  return { states, props, heights } as PlanetLayer;
}

function getHeights(width: number, floats: number[]) {
  const filter = diskFilter(10);
  const result = applyFilter(floats, width, filter).map((v) => v / 0xffffffff);
  return stretchContrast(result);
}

export const getPlanetPixels = (layer: PlanetLayer) =>
  layer.heights.map((v) => {
    const n = v;
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0, n, n + 0.5];
  });
