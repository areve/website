import { Layer, LayerProps, makeLayer, max, min, sum } from "../lib/other";
import { UniverseProps } from "./universeMap";

export interface GalaxyProps extends LayerProps {
  weight: number;
  parentProps: UniverseProps;
}

export interface GalaxyLayer extends Layer {
  props: GalaxyProps;
  weights: number[];
}

export function makeGalaxyLayer(props: GalaxyProps) {
  let layer = makeLayer(props);
  const integers = layer.states.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );
  const sumIntegers = sum(integers);
  const weights = integers.map(
    (v) => ((v / sumIntegers) * props.weight) as number
  );

  return {
    ...layer,
    props,
    weights,
  } as GalaxyLayer;
}

export function renderGalaxy(
  context: CanvasRenderingContext2D | null,
  layer: GalaxyLayer
) {
  if (!context) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const data = layer.weights;
  const maxWeight = max(layer.weights);
  const minWeight = min(layer.weights);
  const range = maxWeight - minWeight;
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  const parentAvg =
    layer.props.parentProps.weight /
    layer.props.parentProps.width /
    layer.props.parentProps.height;

  const parentAvgDiff = layer.props.weight / parentAvg;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      let value = data[i] / range;
      value = value ** (20 / parentAvgDiff);
      pixelData[o + 0] = (value * 0xff) & 0xff;
      pixelData[o + 1] = (value * 0xff) & 0xff;
      pixelData[o + 2] = (value * 0xff) & 0xff;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
