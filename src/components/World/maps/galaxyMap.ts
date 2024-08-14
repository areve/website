import { ref } from "vue";
import { LayerData, LayerProps, PointGenerator } from "../lib/prng";
import { RenderLayer } from "./makeLayer";

export interface GalaxyProps extends LayerProps {
  weight: number;
  // universeProps: UniverseProps;
  galaxyAvgerageWeight: number;
}

export interface GalaxyData extends LayerData {
  // props: GalaxyProps;
  weights: (x: number, y: number) => number;
}

export interface GalaxyLayer extends RenderLayer<GalaxyData, GalaxyProps> {}

export const makeGalaxy = (): GalaxyLayer => {
  //     const generator = new PointGenerator(props.seed);
  //     const scale = props.weight / props.height / props.width;
  //     const weights = (x: number, y: number) =>
  //       generator.getPoint(x, y) * scale;
  //     const weightDiffToAverage = props.weight / props.galaxyAvgerageWeight;
  //     const weightRange = 1;
  //     const pixel = (x: number, y: number) => {
  //       const v = generator.getPoint(x, y);
  //       const n = (v / weightRange) ** (20 / weightDiffToAverage);
  //       return [n, n, n];
  //     };

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
    },
  };
  // const galaxy = makeLayer(
  //   "",
  //   "",
  //   (props: GalaxyProps) => {
  //     const generator = new PointGenerator(props.seed);
  //     const scale = props.weight / props.height / props.width;
  //     const weights = (x: number, y: number) =>
  //       generator.getPoint(x, y) * scale;
  //     const weightDiffToAverage = props.weight / props.galaxyAvgerageWeight;
  //     const weightRange = 1;
  //     const pixel = (x: number, y: number) => {
  //       const v = generator.getPoint(x, y);
  //       const n = (v / weightRange) ** (20 / weightDiffToAverage);
  //       return [n, n, n];
  //     };
  //     return { props, weights, pixel } as GalaxyData;
  //   },
  //   (engine: GalaxyData, x: number, y: number) => ({
  //     hover: engine.weights(x, y),
  //   }),
  //   (x: number, y: number) => {
  //     solarSystem.update({
  //       height: galaxy.props.value.height,
  //       width: galaxy.props.value.width,
  //       seed: galaxy.engine.weights(x, y),
  //       weight: galaxy.engine.weights(x, y),
  //     });
  //     solarSystem.select(0, 0);
  //   }
  // );
  return galaxy;
};
