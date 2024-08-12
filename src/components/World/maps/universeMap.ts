import { seedToInt } from "../lib/other";
import { LayerProps, PointGenerator, Layer } from "../lib/prng";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseLayer extends Layer {
  props: UniverseProps;
  weights: (x: number, y: number) => number;
}

export function makeUniverseLayer(props: UniverseProps) {
  const generator = new PointGenerator(props.seed);
  const scale = props.weight / props.height / props.width;
  const weights = (x: number, y: number) => generator.getPoint(x, y) * scale;
  const pixel = (x: number, y: number) => {
    const n = generator.getPoint(x, y);
    return [n, n, n];
  };
  return { props, weights, pixel } as UniverseLayer;
}
