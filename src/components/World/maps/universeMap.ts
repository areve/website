import {
  getStates,
  sum,
  max,
  min,
  LayerProps,
  seedToInt,
  Layer,
  render,
} from "../lib/other";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseLayer extends Layer {
  props: UniverseProps;
  weights: number[];
}

export function makeUniverseLayer(props: UniverseProps) {
  let states = getStates(props);
  let integers = states.map(seedToInt);
  const scale = props.weight / sum(integers);
  const weights = integers.map((v) => (v * scale) as number);
  return { states, props, weights } as UniverseLayer;
}

export function renderUniverse(
  context: CanvasRenderingContext2D | null,
  layer: UniverseLayer
) {
  const weightRange = max(layer.weights) - min(layer.weights);
  const pixels = layer.weights.map((v) => {
    const n = v / weightRange;
    return [n, n, n];
  });

  render(context, pixels);
}
