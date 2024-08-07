import { MapData, makeMap, sum } from "../lib/other";

export interface UniverseMapData extends MapData {
  weight: number;
  // range: {
  //   min: number
  //   max: number
  // },
  width: number;
  height: number;
  weights: number[];
}

export function makeUniverseMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number
) {
  let map = makeMap(width, height, seed);
  const integers = map.states.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );

  const sumIntegers = sum(integers);
  const weights = integers.map((v) => ((v / sumIntegers) * weight) as number);

  let universe: UniverseMapData = {
    ...map,
    weights,
    width,
    height,
    weight,
  };

  return universe;
}

export function renderUniverse(
  context: CanvasRenderingContext2D | null,
  map: UniverseMapData
) {
  if (!context) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const data = map.weights;
  const rangeMax = map.weight / (map.width * map.height);
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      const value = ((data[i] / rangeMax) * 0xff) & 0xff;
      pixelData[o + 0] = value;
      pixelData[o + 1] = value;
      pixelData[o + 2] = value;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
