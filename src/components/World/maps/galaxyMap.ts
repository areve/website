import { ref } from "vue";
import { LayerData, LayerProps, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";
import { UniverseLayer } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  galaxyAvgerageWeight: number;
}

export interface GalaxyData extends LayerData {
  weights: (x: number, y: number) => number;
}

export interface GalaxyLayer extends RenderLayer<GalaxyData, GalaxyProps> {}

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
    seed: universe?.data.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: universe?.data.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
  };
}

export const makeGalaxy = (actions: {
  hover: (coord: Coord) => void;
  select: (coord: Coord) => void;
}): GalaxyLayer => {
  const galaxy: GalaxyLayer = {
    meta: {
      title: "galaxy",
      description: "each dot is a solar system",
    },
    props: ref<GalaxyProps>(makeGalaxyProps()),
    data: {
      weights: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        return generator.getPoint(x, y);
      },
    },
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      pixel: (x, y) => {
        const generator = new PointGenerator(galaxy.props.value.seed);
        const v = generator.getPoint(x, y);
        const weightRange = 1;
        const weightDiffToAverage =
          galaxy.props.value.weight / galaxy.props.value.galaxyAvgerageWeight;
        const n = (v / weightRange) ** (20 / weightDiffToAverage);

        return [n, n, n];
      },
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
