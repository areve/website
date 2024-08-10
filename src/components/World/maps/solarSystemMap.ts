import { Layer, LayerProps, getStates, render, seedToInt } from "../lib/other";
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
  let states = getStates(props);
  let weights = states.map(seedToInt);
  return { props, states, weights } as SolarSystemLayer;
}

export function renderSolarSystem(
  context: CanvasRenderingContext2D | null,
  layer: SolarSystemLayer
) {
  const pixels = layer.weights.map((v) => {
    const n = v / 0xffffffff;
    return [n, 0, n];
  });

  render(context, pixels);
}
