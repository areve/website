import { diskFilter } from "../filters/diskFilter";
import { LayerProps, LayerMethods, PointGenerator } from "../lib/prng";
import { Coord, coordFromEvent, RenderLayer } from "./makeLayer";
import { ref } from "vue";
import { SolarSystemLayer } from "./solarSystemMap";

export interface PlanetProps extends LayerProps {
  weight: number;
  camera: {
    x: number;
    y: number;
  };
}

export interface PlanetMethods extends LayerMethods {
  heights: (x: number, y: number) => number;
  data: (x: number, y: number) => PlanetData;
}

export interface PlanetData {
  title: string;
  description: string;
  weight: number;
  hover: {
    height: number;
    coord: { x: number; y: number };
  };
}

export interface PlanetRenderLayer
  extends RenderLayer<PlanetMethods, PlanetProps, PlanetData> {
  type: "planet";
}

export function makePlanetProps(
  solarSystem?: SolarSystemLayer,
  coord?: Coord
): PlanetProps {
  return {
    width: solarSystem?.props.value.width ?? 0,
    height: solarSystem?.props.value.height ?? 0,
    seed: solarSystem?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: solarSystem?.methods.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    camera: { x: 0, y: 0 },
  };
}
export const makePlanet = (actions: {
  select: (coord: Coord) => void;
}): PlanetRenderLayer => {
  const filterRadius = 10;
  const filter = diskFilter(filterRadius);

  function heights(x: number, y: number) {
    const generator = new PointGenerator(planet.props.value.seed);
    const padHeight = Math.floor(filter.length / 2);
    const padWidth = Math.floor(filter[0].length / 2);
    let sum = 0;
    for (let fy = 0; fy < filter.length; fy++) {
      for (let fx = 0; fx < filter[0].length; fx++) {
        const px = x + 20 + fx - padWidth;
        const py = y + 20 + fy - padHeight;
        sum += filter[fy][fx] * generator.getPoint(px, py);
      }
    }
    return ((sum - 0.5) * filterRadius) / 2 + 0.5;
  }
  function pixel(x: number, y: number) {
    const n = heights(x, y);
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0, n, n + 0.5];
  }
  let planet: PlanetRenderLayer;
  function data(x: number, y: number): PlanetData {
    return {
      title: "planet",
      description:
        "each dot is a point on a point on the planet sized region of the solar system",
      weight: planet?.props.value.weight ?? 0,
      hover: {
        height: planet?.methods.heights(x, y) ?? 0,
        coord: { x, y },
      },
    };
  }

  planet = {
    type: "planet",
    props: ref<PlanetProps>(makePlanetProps()),
    methods: {
      pixel,
      heights,
      data,
    },
    data: ref<PlanetData>(data(0, 0)),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      mousemove(event) {
        const coord = coordFromEvent(event, planet.props.value);
        planet.data.value = data(coord.x, coord.y)
      },
      click(event) {
        const coord = coordFromEvent(event, planet.props.value);
        actions.select(coord);
      },
    },
  };
  return planet;
};
