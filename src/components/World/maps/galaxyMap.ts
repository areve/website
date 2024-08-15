import { ref } from "vue";
import { LayerMethods, LayerProps, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";
import { UniverseLayer } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  galaxyAvgerageWeight: number;
}

export interface GalaxyMethods extends LayerMethods {
  weights: (x: number, y: number) => number;
}

export interface GalaxyData {
  weight: number;
}

export interface GalaxyLayer extends RenderLayer<GalaxyMethods, GalaxyProps, GalaxyData> {
  type: "galaxy",
}

export function makeGalaxyProps(
  universe?: UniverseLayer,
  coord?: Coord
): GalaxyProps {
  return {
    width: universe?.props.value.width ?? 0,
    height: universe?.props.value.height ?? 0,
    galaxyAvgerageWeight: universe
      ? universe?.props.value.weight /
        universe?.props.value.width /
        universe?.props.value.height
      : 0,
    seed: universe?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: universe?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
  };
}

export const makeGalaxy = (actions: {
  hover: (coord: Coord) => void;
  select: (coord: Coord) => void;
}): GalaxyLayer => {
  const galaxy: GalaxyLayer = {
    type: "galaxy",
    meta: {
      title: "galaxy",
      description: "each dot is a solar system",
    },
    props: ref<GalaxyProps>(makeGalaxyProps()),
    methods: {
      weights: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        return generator.getPoint(x, y);
      },
      pixel: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        const v = generator.getPoint(x, y);
        const weightRange = 1;
        const weightDiffToAverage =
          galaxy.props.value.weight / galaxy.props.value.galaxyAvgerageWeight;
        const n = (v / weightRange) ** (20 / weightDiffToAverage);

        return [n, n, n];
      },
    },
    data: ref<GalaxyData>({
      weight: 0
    }),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, galaxy.props.value);
        actions.hover(coord);
      },
      click(event) {
        const coord = coordFromEvent(event, galaxy.props.value);
        actions.select(coord);
      },
    },
  };

  return galaxy;
};
