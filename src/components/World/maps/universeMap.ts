import { ref } from "vue";
import { LayerProps, PointGenerator, LayerMethods } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseMethods extends LayerMethods {
  weights: (x: number, y: number) => number;
}

export interface UniverseData {
  title: string;
  description: string;
  weight: number;
  hover: {
    weight: number;
    coord: { x: number; y: number };
  };
}
export interface UniverseLayer
  extends RenderLayer<UniverseMethods, UniverseProps, UniverseData> {
  type: "universe";
}

// const actualUniverseWeightKg = 1e53;
const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
// const milkyWayWeightKg = 2.7e27;
// const earthWeightKg = 5.9e24;

export function makeUniverseProps(coord?: Coord): UniverseProps {
  return {
    width: 200,
    height: 200,
    seed: 1234567890,
    weight: thisUniverseWeightKg,
  };
}

export const makeUniverse = (actions: {
  select: (coord: Coord) => void;
}): UniverseLayer => {
  let universe: UniverseLayer;
  function data(x: number, y: number): UniverseData {
    return {
      title: "universe",
      description: "each dot is a galaxy",
      weight: universe?.props.value.weight ?? 0,
      hover: {
        weight: universe?.methods.weights(x, y) ?? 0,
        coord: { x, y },
      },
    };
  }
  universe = {
    type: "universe",
    props: ref<UniverseProps>(makeUniverseProps()),
    methods: {
      weights: (x, y) => {
        const generator = new PointGenerator(universe.props.value.seed);
        const scale =
          universe.props.value.weight /
          universe.props.value.height /
          universe.props.value.width;
        return generator.getPoint(x, y) * scale;
      },
      pixel(x, y) {
        const generator = new PointGenerator(universe.props.value.seed);
        const n = generator.getPoint(x, y);
        return [n, n, n];
      },
    },
    data: ref<UniverseData>(data(0, 0)),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, universe.props.value);
        universe.data.value = data(coord.x, coord.y)
      },
      click(event) {
        const coord = coordFromEvent(event, universe.props.value);
        actions.select(coord);
      },
    },
  };
  return universe;
};
