import { LayerxProps, PointGenerator, Layerx } from "../lib/prng";

export interface UniverseProps extends LayerxProps {
  weight: number;
}

export interface UniverseLayerx extends Layerx {
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
  return { props, weights, pixel } as UniverseLayerx;
}
