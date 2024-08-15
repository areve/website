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
  data: (x: number, y: number) => SolarSystemData;
}

export interface SolarSystemData {
  title: string;
  description: string;
  weight: number;
  hover: {
    weight: number;
    coord: { x: number; y: number };
  };
}

export interface SolarSystemLayer
  extends RenderLayer<SolarSystemMethods, SolarSystemProps, SolarSystemData> {
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

  let solarSystem: SolarSystemLayer;
  function data(x: number, y: number): SolarSystemData {
    
    return {
      title: "solar system",
      description: "each dot is a sun, planet, moon, asteroid",
      weight: solarSystem?.props.value.weight ?? 0,
      hover: {
        weight: solarSystem?.methods.weights(x, y) ?? 0,
        coord: { x, y },
      },
    };
  }
  solarSystem = {
    type: "solarSystem",
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
      data,
    },
    data: ref<GalaxyData>(data(0, 0)),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, solarSystem.props.value);
        solarSystem.data.value = data(coord.x, coord.y)
      },
      click(event) {
        const coord = coordFromEvent(event, solarSystem.props.value);
        actions.select(coord);
      },
    },
  };

  return solarSystem;
};
