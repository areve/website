import { diskFilter } from "../filters/diskFilter";
import { Layer, LayerProps, getStates, render, seedToInt } from "../lib/other";
import { SolarSystemProps } from "./solarSystemMap";

export interface PlanetProps extends LayerProps {
  weight: number;
  solarSystemProps: SolarSystemProps;
}

export interface PlanetLayer extends Layer {
  props: PlanetProps;
  heights: number[];
}

export function makePlanetLayer(props: PlanetProps) {
  let states = getStates(props);
  let integers = states.map(seedToInt);
  const heights = getHeights(props.width, props.height, integers, props.weight);
  return { states, props, heights } as PlanetLayer;
}

function getHeights(
  width: number,
  height: number,
  integers: number[],
  weight: number
) {
  const filter = diskFilter(10);
  const size = (filter.length - 1) / 2;
  const result = integers.map((v, i, a) => {
    const x = i % width;
    const y = Math.floor(i / height);
    if (x < size || x >= width - size) return 0;
    if (y < size || y >= width - size) return 0;

    let output = 0;
    for (let fy = 0; fy < filter.length; ++fy) {
      for (let fx = 0; fx < filter[fy].length; ++fx) {
        const mult = filter[fy][fx];
        const coord = (y + fy - size) * width + (x + fx - size);
        const i2 = integers[coord];
        output += i2 * mult;
      }
    }
    const value = (output - 0xffffffff / 2) * 8 + 0xffffffff / 2; //* totalWeight / universeWeightKg;
    const out2 = value * (weight / 0xffffffff) * 2; //value + weight //* 255 * 255 * 255; // + (value << 8) + (value << 16) + (value << 24);
    return Math.max(Math.min(out2, 0xffffffff), 0);
  });

  return result;
}

export const getPlanetPixels = (layer: PlanetLayer) =>
  layer.heights.map((v) => {
    const n = v / 0xffffffff;
    return n > 0.5 //
      ? [n - 0.5, n - 0.25, 0]
      : [0.25, 0.5, n + 0.5];
  });
