import { LayerxProps, PointGenerator, Layerx } from "../lib/prng";
import { GalaxyLayer } from "./galaxyMap";
import { Layer, makeLayer } from "./makeLayer";
import { SolarSystemLayer } from "./solarSystemMap";

export interface UniverseProps extends LayerxProps {
  weight: number;
}

export interface UniverseLayerx extends Layerx {
  props: UniverseProps;
  weights: (x: number, y: number) => number;
}

export interface UniverseLayer extends Layer<UniverseLayerx, UniverseProps> {}

export const makeUniverse = (
  galaxy: GalaxyLayer,
  solarSystem: SolarSystemLayer
): UniverseLayer => {
  const universe = makeLayer(
    "universe",
    "each dot is a galaxy",
    (props: UniverseProps) => {
      const generator = new PointGenerator(props.seed);
      const scale = props.weight / props.height / props.width;
      const weights = (x: number, y: number) =>
        generator.getPoint(x, y) * scale;
      const pixel = (x: number, y: number) => {
        const n = generator.getPoint(x, y);
        return [n, n, n];
      };
      return { props, weights, pixel } as UniverseLayerx;
    },
    (engine: UniverseLayerx, x: number, y: number) => ({
      hover: engine.weights(x, y),
    }),
    (x: number, y: number) => {
      galaxy.update({
        height: universe.props.value.height,
        width: universe.props.value.width,
        seed: universe.engine.weights(x, y),
        weight: universe.engine.weights(x, y),
        galaxyAvgerageWeight:
          universe.props.value.weight /
          universe.props.value.width /
          universe.props.value.height,
      });
      galaxy.select(0, 0);
      solarSystem.select(0, 0);
    }
  );
  return universe;
};
