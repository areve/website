import { ref } from "vue";
import { LayerProps, PointGenerator, LayerData } from "../lib/prng";
import { GalaxyLayer } from "./galaxyMap";
import { Coord, coordFromEvent, Dimension, RenderLayer } from "./makeLayer";
import { SolarSystemLayer } from "./solarSystemMap";
import { clamp } from "../lib/other";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseData extends LayerData {
  // props: UniverseProps;
  weights: (x: number, y: number) => number;
}

export interface UniverseLayer
  extends RenderLayer<UniverseData, UniverseProps> {}

export const makeUniverse = (actions: {
  select: (coord: Coord) => void;
}): // galaxy: GalaxyLayer,
// solarSystem: SolarSystemLayer
UniverseLayer => {
  // const universe = makeLayer(
  //   "universe",
  //   "each dot is a galaxy",
  //   (props: UniverseProps) => {
  //     const generator = new PointGenerator(props.seed);
  //     const scale = props.weight / props.height / props.width;
  //     const weights = (x: number, y: number) =>
  //       generator.getPoint(x, y) * scale;
  //     const pixel = (x: number, y: number) => {
  //       const n = generator.getPoint(x, y);
  //       return [n, n, n];
  //     };
  //     return { props, weights, pixel } as UniverseData;
  //   },
  //   (engine: UniverseData, x: number, y: number) => ({
  //     hover: engine.weights(x, y),
  //   }),
  //   (x: number, y: number) => {
  //     galaxy.update({
  //       height: universe.props.value.height,
  //       width: universe.props.value.width,
  //       seed: universe.engine.weights(x, y),
  //       weight: universe.engine.weights(x, y),
  //       galaxyAvgerageWeight:
  //         universe.props.value.weight /
  //         universe.props.value.width /
  //         universe.props.value.height,
  //     });
  //     galaxy.select(0, 0);
  //     solarSystem.select(0, 0);
  //   }
  // );

  // const scale = props.weight / props.height / props.width;
  // const weights = (x: number, y: number) =>
  //   generator.getPoint(x, y) * scale;

  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  // const earthWeightKg = 5.9e24;

  const universe: UniverseLayer = {
    meta: {
      title: "universe",
      description: "each dot is a galaxy",
    },
    props: ref<UniverseProps>({
      height: 200,
      width: 200,
      seed: 1234567890,
      weight: thisUniverseWeightKg,
    }),
    data: {
      weights: (x, y) => {
        const generator = new PointGenerator(universe.props.value.seed);
        const scale =
          universe.props.value.weight /
          universe.props.value.height /
          universe.props.value.width;
        return generator.getPoint(x, y) * scale;
      },
    },
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      pixel(x, y) {
        const generator = new PointGenerator(universe.props.value.seed);
        const n = generator.getPoint(x, y);
        return [n, n, n];
      },
      click(event, layer) {
        const coord = coordFromEvent(event, universe.props.value);
        actions.select(coord);
      },
    },
  };
  return universe;
};
