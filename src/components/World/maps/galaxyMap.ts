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
  let states = getStates(props);
  let integers = states.map(seedToInt);
  const scale = props.weight / sum(integers);
  const weights = integers.map((v) => (v * scale) as number);
  return { states, props, weights } as GalaxyLayer;
}

export function renderGalaxy(
  context: CanvasRenderingContext2D | null,
  layer: GalaxyLayer
) {
  if (!context) return;

  const universeGalaxyAvgerageWeight =
    layer.props.universeProps.weight /
    layer.props.universeProps.width /
    layer.props.universeProps.height;
  const weightDiffToAverage = layer.props.weight / universeGalaxyAvgerageWeight;
  const weightRange = max(layer.weights) - min(layer.weights);
  let pixels = layer.weights.map((v) => {
    const scaled = (v / weightRange) ** (20 / weightDiffToAverage);
    return [scaled * 255, scaled * 255, scaled * 255, 255];
  });

  const imageData = new ImageData(context.canvas.width, context.canvas.height);
  imageData.data.forEach((_, i, a) => (a[i] = pixels[(i / 4) >> 0][i % 4]));
  context.putImageData(imageData, 0, 0);
}
