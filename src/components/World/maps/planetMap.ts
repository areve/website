import { diskFilter } from "../filters/diskFilter";
import { LayerxProps, Layerx, PointGenerator } from "../lib/prng";
import { Layer, makeLayer } from "./makeLayer";
import { SolarSystemProps } from "./solarSystemMap";

export interface PlanetProps extends LayerxProps {
  weight: number;
  // solarSystemProps: SolarSystemProps;
  camera: {
    x: number;
    y: number;
  };
}

export interface PlanetLayerx extends Layerx {
  props: PlanetProps;
  heights: (x: number, y: number) => number;
}

export interface PlanetLayer extends Layer<PlanetLayerx, PlanetProps> {}

export const makePlanet = (): PlanetLayer => {
  const planet = makeLayer(
    "planet",
    "each dot is a point on a point on the planet sized region of the solar system",
    (props: PlanetProps) => {
      const generator = new PointGenerator(props.seed);
      const filterRadius = 10;
      const filter = diskFilter(filterRadius);
      const scale = props.weight / 3.6e22; // multiplying heights by this makes planets all water or land, which is like what I want but not today, the number was just somewhere in the middle of expected values
      const heights = (x: number, y: number) => {
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
      };
      const pixel = (x: number, y: number) => {
        const n = heights(x, y);
        return n > 0.5 //
          ? [n - 0.5, n - 0.25, 0]
          : [0, n, n + 0.5];
      };
      return { props, heights, pixel } as PlanetLayerx;
    },
    (engine: PlanetLayerx, x: number, y: number) => ({
      hover: engine.heights(x, y),
    }),
    (x: number, y: number) => {}
  );
  return planet;
};
