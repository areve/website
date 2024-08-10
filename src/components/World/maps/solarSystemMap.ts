import { seedToInt } from "../lib/other";
import { LayerProps, Layer, getStates } from "../lib/prng";
import { GalaxyProps } from "./galaxyMap";

export interface SolarSystemProps extends LayerProps {
  weight: number;
  galaxyProps: GalaxyProps;
}

export interface SolarSystemLayer extends Layer {
  props: SolarSystemProps;
  weights: number[];
}

export function makeSolarSystemLayer(props: SolarSystemProps) {
  const states = getStates(props.seed, props.width * props.height);
  const weights = states.map(seedToInt);
  return { props, states, weights } as SolarSystemLayer;
}

export function getSolarSystemPixels(layer: SolarSystemLayer) {
  return layer.weights.map((v) => {
    const n = v / 0xffffffff;
    return [n, 0, n];
  });
}
