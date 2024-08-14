import { Layerx, LayerxProps, PointGenerator } from "../lib/prng";
import { Layer, makeLayer } from "./makeLayer";
import { SolarSystemLayer } from "./solarSystemMap";
import { UniverseProps } from "./universeMap";

export interface GalaxyProps extends LayerxProps {
  weight: number;
  // universeProps: UniverseProps;
  galaxyAvgerageWeight: number;
}

export interface GalaxyLayerx extends Layerx {
  props: GalaxyProps;
  weights: (x: number, y: number) => number;
}

export interface GalaxyLayer extends Layer<GalaxyLayerx, GalaxyProps> {}

export const makeGalaxy = (solarSystem: SolarSystemLayer): GalaxyLayer => {
  const galaxy = makeLayer(
    "galaxy",
    "each dot is a solar system",
    (props: GalaxyProps) => {
      const generator = new PointGenerator(props.seed);
      const scale = props.weight / props.height / props.width;
      const weights = (x: number, y: number) =>
        generator.getPoint(x, y) * scale;
      const weightDiffToAverage = props.weight / props.galaxyAvgerageWeight;
      const weightRange = 1;
      const pixel = (x: number, y: number) => {
        const v = generator.getPoint(x, y);
        const n = (v / weightRange) ** (20 / weightDiffToAverage);
        return [n, n, n];
      };
      return { props, weights, pixel } as GalaxyLayerx;
    },
    (engine: GalaxyLayerx, x: number, y: number) => ({
      hover: engine.weights(x, y),
    }),
    (x: number, y: number) => {
      solarSystem.update({
        height: galaxy.props.value.height,
        width: galaxy.props.value.width,
        seed: galaxy.engine.weights(x, y),
        weight: galaxy.engine.weights(x, y),
      });
      solarSystem.select(0, 0);
    }
  );
  return galaxy;
};
