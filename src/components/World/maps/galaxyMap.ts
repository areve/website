import { MapData, makeMap } from "../lib/other";

export interface GalaxyMapData extends MapData {
  weight: number;
  weights: Uint32Array;
}

export function makeGalaxyMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number
) {
  let map = makeMap(width, height, seed);
  const weights = new Uint32Array(
    map.states.map((v) => {
      const integer = ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0;
      let vv = integer / 0xffffffff
      let pow = weight / 0xffffffff;
      pow =  32/pow
      vv = (vv ** pow) * 0xffffffff;

      return vv & 0xffffffff;
    })
  );
  let galaxy: GalaxyMapData = {
    ...map,
    weights,
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
  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      let vv = data[i] / 0xffffffff * 255 & 0xff;
      pixelData[o + 0] = vv;
      pixelData[o + 1] = vv;
      pixelData[o + 2] = vv;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
