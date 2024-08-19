import { makeSmoothCurveFunction } from "../curves/smoothCurve";
import { Coord } from "../lib/interfaces";
import { clampZeroToOne, Hsv, hsv2rgb } from "../lib/other";

export const temperatureIcinessCurve = makeSmoothCurveFunction([
  { x: 0, y: 1 },
  { x: 0.2, y: 0.9 },
  { x: 0.3, y: 0.4 },
  { x: 0.5, y: 0.1 },
  { x: 1, y: 0 },
]);

export const heightIcinessCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.85, y: 0.12 },
  { x: 0.95, y: 0.9 },
  { x: 1, y: 1 },
]);

export const temperatureDesertCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.7, y: 0.1 },
  { x: 0.85, y: 0.9 },
  { x: 1, y: 1 },
]);

export const moistureDesertCurve = makeSmoothCurveFunction([
  { x: 0, y: 1 },
  { x: 0.15, y: 0.9 },
  { x: 0.3, y: 0.1 },
  { x: 1, y: 0 },
]);

export const seaDepthCurve = makeSmoothCurveFunction([
  { x: 0, y: 0 },
  { x: 0.25, y: 0.6 },
  { x: 1, y: 1 },
]);

const c = clampZeroToOne;

export function planetPixel(coord: Coord, h: number, t: number, m: number) {
  const seaLevel = 0.6;
  const isSea = h < seaLevel;
  const sd = c(seaDepthCurve(1 - h / seaLevel));
  const sh = ((h - seaLevel) / (1 - seaLevel)) ** 0.5;
  const i = c(heightIcinessCurve(h) + temperatureIcinessCurve(t));
  const d = c(moistureDesertCurve(m) + temperatureDesertCurve(t));

  if (isSea) {
    // shallow hsv(229, 47%, 64%)
    // normal water hsv(227, 70%, 35%)
    // deep hsv(231, 71%, 31%)
    const seaHsv: Hsv = [
      // we have unused m t here
      229 / 360,
      0.47 + sd * 0.242 - 0.1 + t * 0.2,
      0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1,
    ];
    return hsv2rgb([
      seaHsv[0], //
      c(seaHsv[1] - 0.2 * i),
      c(seaHsv[2] + 0.2 * i),
    ]);
  } else {
    // jungle hsv(92, 41%, 23%)
    // tundra hsv(78, 24%, 27%)
    // desert hsv(37, 35%, 89%)
    // australia hsv(31, 41%, 58%)
    // grass hsv(77, 34%, 40%)
    // mountain hsv(35, 21%, 64%)
    const landHsv: Hsv = [
      //
      77 / 360 - sh * (32 / 360) - 16 / 360 + m * (50 / 360),
      0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
      0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
    ]; //[0.05 + m ** 0.6 * 0.2, 0.8 - h * 0.2, 1.4 - h];
    return hsv2rgb([
      landHsv[0] - d * 0.1,
      c(landHsv[1] - 0.3 * i + d * 0.1),
      c(landHsv[2] + 0.6 * i + d * 0.45),
    ]);
  }
}
