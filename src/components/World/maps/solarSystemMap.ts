import { Layer, LayerProps, getStates, seedToInt } from "../lib/other";
import { GalaxyProps } from "./galaxyMap";

export interface SolarSystemProps extends LayerProps {
  weight: number;
  galaxyProps: GalaxyProps;
}

export interface SolarSystemLayer extends Layer {
  props: SolarSystemProps;
  weights: number[];
}

export function makeSolarSystemLayer(props: SolarSystemProps) {
  let states = getStates(props);
  let weights = states.map(seedToInt);
  return { props, states, weights } as SolarSystemLayer;
}

export function renderSolarSystem(
  context: CanvasRenderingContext2D | null,
  layer: SolarSystemLayer
) {
  if (!context) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const data = layer.weights;
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      let vv = ((data[i] / 0xffffffff) * 255) & 0xff;
      pixelData[o + 0] = vv;
      pixelData[o + 1] = 0;
      pixelData[o + 2] = vv;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
