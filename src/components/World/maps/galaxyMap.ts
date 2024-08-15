import { ref } from "vue";
import { LayerMethods, LayerProps, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";
import { UniverseLayer } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  galaxyAverageWeight: number;
}

export interface GalaxyMethods extends LayerMethods {
  weights: (x: number, y: number) => number;
  data: (x: number, y: number) => GalaxyData;
}

export interface GalaxyData {
  title: string;
  description: string;
  weight: number;
  hover: {
    weight: number;
    coord: { x: number; y: number };
  };
}

export interface GalaxyLayer
  extends RenderLayer<GalaxyMethods, GalaxyProps, GalaxyData> {
  type: "galaxy";
}

export function makeGalaxyProps(
  universe?: UniverseLayer,
  coord?: Coord
): GalaxyProps {
  return {
    width: universe?.props.value.width ?? 0,
    height: universe?.props.value.height ?? 0,
    galaxyAverageWeight: universe
      ? universe?.props.value.weight /
        universe?.props.value.width /
        universe?.props.value.height
      : 0,
    seed: universe?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: universe?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
  };
}

export const makeGalaxy = (actions: {
  select: (coord: Coord) => void;
}): GalaxyLayer => {
  let galaxy: GalaxyLayer;
  function data(x: number, y: number): GalaxyData {
    return {
      title: "galaxy",
      description: "each dot is a solar system",
      weight: galaxy?.props.value.weight ?? 0,
      hover: {
        weight: galaxy?.methods.weights(x, y) ?? 0,
        coord: { x, y },
      },
    };
  }
  galaxy = {
    type: "galaxy",
    props: ref<GalaxyProps>(makeGalaxyProps()),
    methods: {
      weights: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        const scale =
          galaxy.props.value.weight /
          galaxy.props.value.height /
          galaxy.props.value.width;
        return generator.getPoint(x, y) * scale;
      },
      pixel: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        const v = generator.getPoint(x, y);
        const weightRange = 1;
        const weightDiffToAverage =
          galaxy.props.value.weight / galaxy.props.value.galaxyAverageWeight;
        const n = (v / weightRange) ** (20 / weightDiffToAverage);

        return [n, n, n];
      },
      data,
    },
    data: ref<GalaxyData>(data(0, 0)),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, galaxy.props.value);
        galaxy.data.value = data(coord.x, coord.y);
      },
      click(event) {
        const coord = coordFromEvent(event, galaxy.props.value);
        actions.select(coord);
      },
    },
  };

  return galaxy;
};
