import { ref } from "vue";
import { hsv2rgb } from "../lib/other";
import { LayerProps, LayerMethods, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";
import { GalaxyLayer, GalaxyData } from "./galaxyMap";

export interface SolarSystemProps extends LayerProps {
  weight: number;
}

export interface SolarSystemMethods extends LayerMethods {
  weights: (x: number, y: number) => number;
  hues: (x: number, y: number) => number;
}

export interface SolarSystemData {
  weight: number;
}

export interface SolarSystemLayer
  extends RenderLayer<
    SolarSystemMethods,
    SolarSystemProps,
    SolarSystemData
  > {
  type: "solarSystem";
}

export function makeSolarSystemProps(
  galaxy?: GalaxyLayer,
  coord?: Coord
): SolarSystemProps {
  return {
    width: galaxy?.props.value.width ?? 1,
    height: galaxy?.props.value.height ?? 1,
    seed: galaxy?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: galaxy?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
  };
}

export const makeSolarSystem = (actions: {
  hover: (coord: Coord) => void;
  select: (coord: Coord) => void;
}): SolarSystemLayer => {
  function hues(x: number, y: number) {
    const generator = new PointGenerator(
      solarSystem.props.value.seed * 136395369829
    );

    return generator.getPoint(x, y);
  }

  function weights(x: number, y: number) {
    const generator = new PointGenerator(solarSystem.props.value.seed);

    const scale =
      solarSystem.props.value.weight /
      solarSystem.props.value.height /
      solarSystem.props.value.width;
    return generator.getPoint(x, y) * scale;
  }

  function floats(x: number, y: number) {
    const generator = new PointGenerator(solarSystem.props.value.seed);

    return generator.getPoint(x, y) ** 100;
  }

  const solarSystem: SolarSystemLayer = {
    type: "solarSystem",
    meta: {
      title: "solar system",
      description: "each dot is a sun, planet, moon, asteroid",
    },
    props: ref<SolarSystemProps>(makeSolarSystemProps()),
    methods: {
      weights,
      hues,
      pixel: (x, y) => {
        const v = floats(x, y);
        const h = hues(x, y);
        const [r, g, b] = hsv2rgb(h, 1, 1).map((v) => v / 4 + 0.75);
        return [v * r, v * g, v * b];
      },
    },
    data: ref<GalaxyData>({
      weight: 0,
    }),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, solarSystem.props.value);
        actions.hover(coord);
      },
      click(event) {
        const coord = coordFromEvent(event, solarSystem.props.value);
        actions.select(coord);
      },
    },
  };

  return solarSystem;
};
