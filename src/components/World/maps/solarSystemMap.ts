import { seedToFloat, seedToInt } from "../lib/other";
import { LayerProps, Layer, getStates } from "../lib/prng";
import { GalaxyProps } from "./galaxyMap";

export interface SolarSystemProps extends LayerProps {
  weight: number;
  galaxyProps: GalaxyProps;
}

export interface SolarSystemLayer extends Layer {
  props: SolarSystemProps;
  weights: number[];
  hues: number[];
}

export function makeSolarSystemLayer(props: SolarSystemProps) {
  const states = getStates(props.seed, props.width * props.height);
  const integers = states.map(seedToInt);
  let weights = integers.map((v) => (v & 0xffff) / 0xffff);
  weights = weights.map((v) => v ** 100);
  const hues = integers.map((v) => ((v / 0xffff) >> 0) / 0xffff);
  return { props, states, weights, hues } as SolarSystemLayer;
}

function h2rgb(theta: number): [r: number, g: number, b: number] {
  const h = ((theta % 360) + 360) % 360;
  const s = Math.floor(h / 60);
  const n = h / 60 - s;
  const z = [0, 0, n, 1, 1, 1 - n, 0, 0, n, 1];
  return [z[s + 4], z[s + 2], z[s]];
}

export function getSolarSystemPixels(layer: SolarSystemLayer) {
  return layer.weights.map((v, i) => {
    const h = layer.hues[i];
    const [r, g, b] = h2rgb(h * 360).map((v) => v / 4 + 0.75);
    return [v * r, v * g, v * b];
  });
}
