import {
  Layer,
  LayerProps,
  getStates,
  max,
  min,
  seedToInt,
  sum,
} from "../lib/other";
import { UniverseProps } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  universeProps: UniverseProps;
}

export interface GalaxyLayer extends Layer {
  props: GalaxyProps;
  weights: number[];
}

export function makeGalaxyLayer(props: GalaxyProps) {
  const states = getStates(props);
  const integers = states.map(seedToInt);
  const scale = props.weight / sum(integers);
  const weights = integers.map((v) => (v * scale) as number);
  return { states, props, weights } as GalaxyLayer;
}

export function getGalaxyPixels(layer: GalaxyLayer) {
  const universeGalaxyAvgerageWeight =
    layer.props.universeProps.weight /
    layer.props.universeProps.width /
    layer.props.universeProps.height;
  const weightDiffToAverage = layer.props.weight / universeGalaxyAvgerageWeight;
  const weightRange = max(layer.weights) - min(layer.weights);
  return layer.weights.map((v) => {
    const n = (v / weightRange) ** (20 / weightDiffToAverage);
    return [n, n, n];
  });
}
