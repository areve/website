import { diskFilter } from "../filters/diskFilter";
import { MapData, makeMap } from "../lib/other";

export interface PlanetMapData extends MapData {
  weight: number;
  heights: Uint32Array;
}

export function makePlanetMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number
) {
  const map = makeMap(width, height, seed);

  const integers = new Uint32Array(
    map.states.map(
      (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
    )
  );
  const heights = getHeights(width, height, integers, weight);
  const planetMap: PlanetMapData = {
    ...map,
    heights,
    weight,
  };

  return planetMap;
}

function getHeights(
  width: number,
  height: number,
  weightMap: Uint32Array,
  weight: number
) {
  const filter = diskFilter(10);
  const size = (filter.length - 1) / 2;
  const result = weightMap.map((v, i, a) => {
    const x = i % width;
    const y = Math.floor(i / height);
    if (x < size || x >= width - size) return 0;
    if (y < size || y >= width - size) return 0;

    let output = 0;
    for (let fy = 0; fy < filter.length; ++fy) {
      for (let fx = 0; fx < filter[fy].length; ++fx) {
        const mult = filter[fy][fx];
        const coord = (y + fy - size) * width + (x + fx - size);
        const i2 = weightMap[coord];
        output += i2 * mult;
      }
    }
    const value = (output - 0xffffffff / 2) * 8 + 0xffffffff / 2; //* totalWeight / universeWeightKg;
    const out2 = value * (weight / 0xffffffff) * 2; //value + weight //* 255 * 255 * 255; // + (value << 8) + (value << 16) + (value << 24);
    return Math.max(Math.min(out2, 0xffffffff), 0);
  });

  return result;
}

export function renderPlanet(
  context: CanvasRenderingContext2D | null,
  map: PlanetMapData
) {
  if (!context) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  const data = map.heights;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      const vv = ((data[i] / 0xffffffff) * 255) & 0xff;
      if (vv > 127) {
        pixelData[o + 0] = vv - 127;
        pixelData[o + 1] = vv - 63; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = 0; //(data[i] >> 16) & 0xff;
      } else {
        pixelData[o + 0] = 63;
        pixelData[o + 1] = 127; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = vv + 127; //(data[i] >> 16) & 0xff;
      }

      pixelData[o + 3] = 255; //(data[i] >> 24) & 0xff;
    }
  }

  context.putImageData(imageData, 0, 0);
}
