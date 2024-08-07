import { MapData, makeMap } from "../lib/other";

export interface UniverseMapData extends MapData {
  weight: number;
  integers: Uint32Array;
}

export function makeUniverseMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number
) {
  let map = makeMap(width, height, seed);
  const integers = new Uint32Array(
    map.states.map(
      (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
    )
  );
  let universe: UniverseMapData = {
    ...map,
    integers,
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

  const data = map.integers;
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;
      pixelData[o + 0] = ((data[i] / 0xffffffff) * 255) & 0xff;
      pixelData[o + 1] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 8) & 0xff;
      pixelData[o + 2] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 16) & 0xff;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
