import { MapData, MapDataProps, makeMap } from "../lib/other";
import { GalaxyMapDataProps } from "./galaxyMap";

export interface SolarSystemMapDataProps extends MapDataProps {
  weight: number;
  parentProps: GalaxyMapDataProps;
}

export interface SolarSystemMapData extends MapData {
  props: SolarSystemMapDataProps;
  weights: number[];
}

export function makeSolarSystemMap(
  width: number,
  height: number,
  seed: Uint8Array,
  weight: number,
  parentProps: GalaxyMapDataProps
) {
  let map = makeMap(width, height, seed);
  const weights = map.states.map((v) => {
    const integer = ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0;
    let vv = integer;

    return vv & 0xffffffff;
  });

  let solarSystem: SolarSystemMapData = {
    ...map,
    weights,
    props: {
      ...map.props,
      parentProps,
      weight,
    },
  };

  return solarSystem;
}

export function renderSolarSystem(
  context: CanvasRenderingContext2D | null,
  map: SolarSystemMapData
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

      let vv = ((data[i] / 0xffffffff) * 255) & 0xff;
      pixelData[o + 0] = vv;
      pixelData[o + 1] = 0;
      pixelData[o + 2] = vv;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}
