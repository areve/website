import { Layer, LayerProps, PointGenerator } from "../lib/prng";
import { UniverseProps } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  universeProps: UniverseProps;
}

export interface GalaxyLayer extends Layer {
  props: GalaxyProps;
  weights: (x: number, y: number) => number;
}

export function makeGalaxyLayer(props: GalaxyProps) {
  const generator = new PointGenerator(props.seed);
  const scale = props.weight / props.height / props.width;
  const weights = (x: number, y: number) => generator.getPoint(x, y) * scale;
  const universeGalaxyAvgerageWeight =
    props.universeProps.weight /
    props.universeProps.width /
    props.universeProps.height;
  const weightDiffToAverage = props.weight / universeGalaxyAvgerageWeight;
  const weightRange = 1;
  const pixel = (x: number, y: number) => {
    const v = generator.getPoint(x, y);
    const n = (v / weightRange) ** (20 / weightDiffToAverage);
    return [n, n, n];
  };
  return { props, weights, pixel } as GalaxyLayer;
}
