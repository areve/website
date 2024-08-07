import { MapData, makeMap, sum } from "../lib/other";

export interface GalaxyMapData extends MapData {
  weight: number;
  width: number;
  height: number;
  weights: number[];
}

export function makeGalaxyMap(
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

  let galaxy: GalaxyMapData = {
    ...map,
    weights,
    width,
    height,
    weight,
  };

  return galaxy;
}

export function renderGalaxy(
  context: CanvasRenderingContext2D | null,
  map: GalaxyMapData
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

      let value = ((data[i] / rangeMax) / 2);
      value = value ** 20
      //  console.assert(value < 1)
      pixelData[o + 0] = (value * 0xff) & 0xff;
      pixelData[o + 1] = (value * 0xff) & 0xff;
      pixelData[o + 2] = (value * 0xff) & 0xff;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
