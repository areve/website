import { extend } from "hammerjs";
import { diskFilter } from "../filters/diskFilter";
import { seedToFloat } from "../lib/other";
import { stretchContrast } from "../lib/stretchContrast";
import { applyFilter } from "../lib/applyFilter";
import { LayerProps, Layer, getStates } from "../lib/prng";
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
  const states = getStates(props.seed, props.width * props.height);
  const floats = states.map(seedToFloat);
  const filter = diskFilter(10);
  const blurred = applyFilter(floats, props.width, props.height, filter);
  const heights = stretchContrast(blurred);
  return { states, props, heights } as PlanetLayer;
}

export const getPlanetPixels = (layer: PlanetLayer) =>
  layer.heights.map((v) => {
    const n = v;
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0, n, n + 0.5];
  });
