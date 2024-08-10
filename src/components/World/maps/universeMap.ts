import { sum, max, min, seedToInt } from "../lib/other";
import { LayerProps, Layer, getStates } from "../lib/prng";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseLayer extends Layer {
  props: UniverseProps;
  weights: number[];
}

export function makeUniverseLayer(props: UniverseProps) {
  const states = getStates(props.seed, props.width * props.height);
  const integers = states.map(seedToInt);
  const scale = props.weight / sum(integers);
  const weights = integers.map((v) => (v * scale) as number);
  return { states, props, weights } as UniverseLayer;
}

export function getUniversePixels(layer: UniverseLayer) {
  const weightRange = max(layer.weights) - min(layer.weights);
  return layer.weights.map((v) => {
    const n = v / weightRange;
    return [n, n, n];
  });
}
