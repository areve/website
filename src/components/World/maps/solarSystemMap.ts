import { hsv2rgb } from "../lib/other";
import { LayerxProps, Layerx, PointGenerator } from "../lib/prng";
import { GalaxyProps } from "./galaxyMap";
import { Layer, makeLayer } from "./makeLayer";
import { PlanetLayer, PlanetProps } from "./planetMap";

export interface SolarSystemProps extends LayerxProps {
  weight: number;
  // galaxyProps: GalaxyProps;
}

export interface SolarSystemLayerx extends Layerx {
  props: SolarSystemProps;
  weights: (x: number, y: number) => number;
  hues: (x: number, y: number) => number;
}

export interface SolarSystemLayer
  extends Layer<SolarSystemLayerx, SolarSystemProps> {}

export const makeSolarSystem = (planet: PlanetLayer): SolarSystemLayer => {
  const solarSystem = makeLayer(
    "solar system",
    "each dot is a sun, planet, moon, asteroid",
    (props: SolarSystemProps) => {
      const generator = new PointGenerator(props.seed);
      const scale = props.weight / props.height / props.width;
      const weights = (x: number, y: number) =>
        generator.getPoint(x, y) * scale;
      const floats = (x: number, y: number) => generator.getPoint(x, y) ** 100;
      const hueSeed = 136395369829;
      const hues = (x: number, y: number) =>
        generator.getPoint(x * hueSeed, y * hueSeed) * scale;
      const pixel = (x: number, y: number) => {
        const v = floats(x, y);
        const h = hues(x, y);
        const [r, g, b] = hsv2rgb(h, 1, 1).map((v) => v / 4 + 0.75);
        return [v * r, v * g, v * b];
      };
      return { props, weights, pixel } as SolarSystemLayerx;
    },
    (engine: SolarSystemLayerx, x: number, y: number) => ({
      hover: engine.weights(x, y),
    }),
    (x: number, y: number) => {
      const newPlanetProps = {
        height: solarSystem.props.value.height,
        width: solarSystem.props.value.width,
        seed: solarSystem.engine.weights(x, y),
        weight: solarSystem.engine.weights(x, y),
        camera: { x: 0, y: 0 },
      } as PlanetProps;
      console.log("solarSystem", x, y, newPlanetProps);

      planet.update(newPlanetProps);
    }
  );
  return solarSystem;
};
