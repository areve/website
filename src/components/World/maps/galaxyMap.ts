import { ref } from "vue";
import { LayerData, LayerProps, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";

export interface GalaxyProps extends LayerProps {
  weight: number;
  galaxyAvgerageWeight: number;
}

export interface GalaxyData extends LayerData {
  weights: (x: number, y: number) => number;
}

export interface GalaxyLayer extends RenderLayer<GalaxyData, GalaxyProps> {}

export const makeGalaxy = (actions: {
  hover: (coord: Coord) => void;
  select: (coord: Coord) => void;
}): GalaxyLayer => {
  const galaxy: GalaxyLayer = {
    meta: {
      title: "galaxy",
      description: "each dot is a solar system",
    },
    props: ref<GalaxyProps>({
      height: 200,
      width: 200,
      seed: 0,
      weight: 0,
      galaxyAvgerageWeight: 0,
    }),
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
