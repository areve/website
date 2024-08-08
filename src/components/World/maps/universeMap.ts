import { getStates, sum, max, min, LayerProps, seedToInt, Layer } from "../lib/other";

export interface UniverseProps extends LayerProps {
  weight: number;
}

export interface UniverseLayer extends Layer {
  props: UniverseProps;
  weights: number[];
}

export function makeUniverseLayer(props: UniverseProps) {
  let states = getStates(props);
  let integers = states.map(seedToInt);
  const scale = props.weight / sum(integers);
  const weights = integers.map((v) => (v * scale) as number);
  return { states, props, weights } as UniverseLayer;
}

export function renderUniverse(
  context: CanvasRenderingContext2D | null,
  layer: UniverseLayer
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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      const value = ((data[i] / range) * 0xff) & 0xff;
      pixelData[o + 0] = value;
      pixelData[o + 1] = value;
      pixelData[o + 2] = value;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
