import { diskFilter } from "../filters/diskFilter";
import { LayerProps, LayerData, PointGenerator } from "../lib/prng";
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

export interface PlanetLayer extends LayerData {
  heights: (x: number, y: number) => number;
}

export interface PlanetLiveData {
  height: number;
}


export interface PlanetRenderLayer
  extends RenderLayer<PlanetLayer, PlanetProps, PlanetLiveData> {}

export function makePlanetProps(
  solarSystem?: SolarSystemLayer,
  coord?: Coord
): PlanetProps {
  return {
    width: solarSystem?.props.value.width ?? 0,
    height: solarSystem?.props.value.height ?? 0,
    seed: solarSystem?.data.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    weight: solarSystem?.data.weights(coord?.x ?? 0, coord?.y ?? 0) ?? 0,
    camera: { x: 0, y: 0 },
  };
}
export const makePlanet = (actions: {
  select: (coord: Coord) => void;
  hover: (coord: Coord) => void;
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
  const planet: PlanetRenderLayer = {
    meta: {
      title: "planet",
      description:
        "each dot is a point on a point on the planet sized region of the solar system",
    },
    props: ref<PlanetProps>(makePlanetProps()),
    data: {
      heights,
    },
    liveData: ref<PlanetLiveData>({
      height: 0
    }),
    canvas: {
      element: ref<HTMLCanvasElement>(undefined as any),
      context: null as CanvasRenderingContext2D | null,
      pixel,
      mousemove(event) {
        const coord = coordFromEvent(event, planet.props.value);
        actions.hover(coord);
      },
      click(event) {
        const coord = coordFromEvent(event, planet.props.value);
        actions.select(coord);
      },
    },
  };
  return planet;
};
