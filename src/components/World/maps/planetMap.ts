import { diskFilter } from "../filters/diskFilter";
import { Cells, getCells } from "../lib/other";

export function makePlanetMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number
) {
  const planet = getCells(width, height, seed);

  const planetMap = makePlanetMapInternal(
    width,
    height,
    planet.cellIntegers,
    weight
  );

  planet.cellIntegers = planetMap;
  (planet as any).weight = weight; // TODO do it better
  return planet;
}

function makePlanetMapInternal(
  width: number,
  height: number,
  weightMap: number[],
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
  data: number[]
) {
  if (!context) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;

      const vv = ((data[i] / 0xffffffff) * 255) & 0xff;
      if (vv > 127) {
        pixelData[o + 0] = vv;
        pixelData[o + 1] = vv * 2 - 127; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = 0; //(data[i] >> 16) & 0xff;
      } else {
        pixelData[o + 0] = 0;
        pixelData[o + 1] = vv; //(data[i] >> 8) & 0xff;
        pixelData[o + 2] = vv * 2; //(data[i] >> 16) & 0xff;
      }

      pixelData[o + 3] = 255; //(data[i] >> 24) & 0xff;
    }
  }

  context.putImageData(imageData, 0, 0);
}
