import { clampZeroToOne } from "../lib/clamp";
import { Hsv, hsv2rgb } from "../lib/color";
import { makeOpenSimplex3dGenerator } from "../noise/openSimplex";
import { makeSmoothCurveFunction } from "./smoothCurve";

function logSome(...args: any[]) {
  if (((Math.random() * 10000) | 0) % 10000 === 0) console.log(...args);
}

const c = clampZeroToOne;

const temperatureIcinessCurve = makeSmoothCurveFunction([
  { x: 0, y: 1 },
  { x: 0.2, y: 0.9 },
  { x: 0.3, y: 0.4 },
  { x: 0.5, y: 0.1 },
  { x: 1, y: 0 },
]);

const heightIcinessCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.85, y: 0.12 },
  { x: 0.95, y: 0.9 },
  { x: 1, y: 1 },
]);

const temperatureDesertCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.7, y: 0.1 },
  { x: 0.85, y: 0.9 },
  { x: 1, y: 1 },
]);

const moistureDesertCurve = makeSmoothCurveFunction([
  { x: 0, y: 1 },
  { x: 0.15, y: 0.9 },
  { x: 0.3, y: 0.1 },
  { x: 1, y: 0 },
]);

const seaDepthCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.25, y: 0.6 },
  { x: 1, y: 1 },
]);

const color = {
  sea: hsv2rgb([227 / 360, 0.7, 0.35]),
  deepSea: hsv2rgb([231 / 360, 0.71, 0.31]),
  shallowSea: hsv2rgb([229 / 360, 0.47, 0.64]),
  grassland: hsv2rgb([77 / 360, 0.34, 0.4]),
  jungle: hsv2rgb([92 / 360, 0.41, 0.23]),
  tundra: hsv2rgb([78 / 360, 0.24, 0.27]),
  desert: hsv2rgb([37 / 360, 0.35, 0.89]),
  australia: hsv2rgb([31 / 360, 0.41, 0.58]),
  grass: hsv2rgb([77 / 360, 0.34, 0.4]),
  mountain: hsv2rgb([35 / 360, 0.21, 0.64]),
};

export const makeWorld = (seed: number) => {
  const makeWorldGenerator = (seed: number) => {
    const height1 = makeOpenSimplex3dGenerator(seed * 0.1, 129);
    const height2 = makeOpenSimplex3dGenerator(seed * 0.2, 65);
    const height3 = makeOpenSimplex3dGenerator(seed * 0.3, 17);
    const height4 = makeOpenSimplex3dGenerator(seed * 0.4, 1);
    const temperature1 = makeOpenSimplex3dGenerator(seed * 0.5, 71);
    const temperature2 = makeOpenSimplex3dGenerator(seed * 0.5, 15);
    const moisture1 = makeOpenSimplex3dGenerator(seed * 0.6, 67);
    const moisture2 = makeOpenSimplex3dGenerator(seed * 0.6, 13);

    return (x: number, y: number, z: number) => {
      const height =
        0.6 * height1(x, y, z) + //
        0.3 * height2(x, y, z) +
        0.15 * height3(x, y, z) +
        0.05 * height4(x, y, z);
      const temperature =
        0.7 * temperature1(x, y, z) + //
        0.3 * temperature2(x, y, z);
      const moisture =
        0.7 * moisture1(x, y, z) + //
        0.3 * moisture2(x, y, z);

      const seaLevel = 0.6;
      const isSea = height < seaLevel;

      const heightAboveSeaLevel = ((height - seaLevel) / (1 - seaLevel)) ** 0.5;
      const seaDepth = c(seaDepthCurve(1 - height / seaLevel));

      const iciness = c(
        heightIcinessCurve(height) + temperatureIcinessCurve(temperature)
      );
      const desert = c(
        moistureDesertCurve(moisture) + temperatureDesertCurve(temperature)
      );
      return {
        height,
        isSea,
        heightAboveSeaLevel,
        seaDepth,
        moisture,
        temperature,
        iciness,
        desert,
      };
    };
  };

  const worldPoint = makeWorldGenerator(seed);

  const pixel = (x: number, y: number) => {
    const v = worldPoint(x, y, world.frame );
    const sh = v.heightAboveSeaLevel;
    const sd = v.seaDepth;
    const m = v.moisture;
    const t = v.temperature;
    const i = v.iciness;
    const d = v.desert;

    if (v.isSea) {
      const seaHsv: Hsv = [
        229 / 360,
        0.47 + sd * 0.242 - 0.1 + t * 0.2,
        0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1,
      ];
      return hsv2rgb([
        seaHsv[0],
        c(seaHsv[1] - 0.2 * i),
        c(seaHsv[2] + 0.2 * i),
      ]);
    } else {
      const landHsv: Hsv = [
        77 / 360 - sh * (32 / 360) - 16 / 360 + m * (50 / 360),
        0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
        0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
      ];
      return hsv2rgb([
        landHsv[0] - d * 0.1,
        c(landHsv[1] - 0.3 * i + d * 0.1),
        c(landHsv[2] + 0.6 * i + d * 0.45),
      ]);
    }
  };

  const world = {
    dimensions: { width: 300, height: 300 },
    camera: { x: 0, y: 0, zoom: 1 },
    title: "World",
    pixel,
    frame: 0,
    selected: false,
  };

  return world;
};
