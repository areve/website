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
  const weights = integers.map((v) => (v & 0xffff) / 0xffff);
  const hues = integers.map((v) => ((v / 0xffff) >> 0) / 0xffff);
  // console.log(integers);
  // console.log(hues);
  // const hues = integers.map((v) => (v & 0xffff) / 0xffff);
  return { props, states, weights, hues } as SolarSystemLayer;
}

function h2rgb(h: number): { r: number; g: number; b: number } {
  // Ensure H is within the range [0, 360)
  h = h % 360;
  if (h < 0) h += 360;

  // Calculate the corresponding RGB multipliers based on the hue segment
  const sector = Math.floor(h / 60); // There are 6 sectors: [0°-60°), [60°-120°), ..., [300°-360°)
  const fraction = h / 60 - sector; // Fractional part within the sector

  const p = 0; // Multiplier for the "off" color channel
  const q = 1 - fraction; // Multiplier decreasing within the sector
  const t = fraction; // Multiplier increasing within the sector

  switch (sector) {
    case 0:
      return { r: 1, g: t, b: p }; // Red to Yellow
    case 1:
      return { r: q, g: 1, b: p }; // Yellow to Green
    case 2:
      return { r: p, g: 1, b: t }; // Green to Cyan
    case 3:
      return { r: p, g: q, b: 1 }; // Cyan to Blue
    case 4:
      return { r: t, g: p, b: 1 }; // Blue to Magenta
    case 5:
      return { r: 1, g: p, b: q }; // Magenta to Red
    default:
      return { r: 1, g: 0, b: 0 }; // Fallback in case of an unexpected value
  }
}
export function getSolarSystemPixels(layer: SolarSystemLayer) {
  // we want some blobs of different sizes
  // big suns (few)
  // small planets (some)
  // tiny rocks (many)
  return layer.weights.map((v, i) => {
    const h = layer.hues[i];
    const { r, g, b } = h2rgb(h * 360);
    // TODO below is not rhe place to divide by 9 or 3, it should have been sorted earlier
    // TODO make weights absolute instead of relative
    return v > 0.9999 // sun
      ? [v * r / 2 + 0.5, v * g / 2 + 0.5, v * b / 2 + 0.5]
      : v > 0.99 // planet
      ? [(v / 3) * r, (v / 3) * g, (v / 3) * b]
      : v > 0.9 // rock
      ? [(v / 9) * r, (v / 9) * g, (v / 9) * b]
      : [v / 100, v / 100, v / 100]; // dust or nothing
  });
}
