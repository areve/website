import { hsv2rgb, seedToFloat, seedToInt } from "../lib/other";
import { LayerProps, Layer, getStates } from "../lib/prng";
import { GalaxyProps } from "./galaxyMap";

export interface SolarSystemProps extends LayerProps {
  weight: number;
  galaxyProps: GalaxyProps;
}

export interface SolarSystemLayer extends Layer {
  props: SolarSystemProps;
  weights: number[];
  hues: number[];
}

export function makeSolarSystemLayer(props: SolarSystemProps) {
  const states = getStates(props.seed, props.width * props.height);
  const integers = states.map(seedToInt);
  let weights = integers.map((v) => (v & 0xffff) / 0xffff);
  weights = weights.map((v) => v ** 100);
  const hues = integers.map((v) => ((v / 0xffff) >> 0) / 0xffff);
  return { props, states, weights, hues } as SolarSystemLayer;
}

export function getSolarSystemPixels(layer: SolarSystemLayer) {
  return layer.weights.map((v, i) => {
    const h = layer.hues[i];
    const [r, g, b] = hsv2rgb(h, 1, 1).map((v) => v / 4 + 0.75);
    return [v * r, v * g, v * b];
  });
}
