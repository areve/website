import { Coord } from "../lib/interfaces";

type DistortionType =
  | "spherize"
  | "pinch"
  | "bloat"
  | "wave"
  | "punk"
  | "swirl2"
  | "swirl";

const distortionFunctions: Record<
  DistortionType,
  (cx: number, cy: number, r: number, theta: number) => [number, number]
> = {
  spherize: (cx, cy, r) => [
    cx * Math.sin((r * Math.PI) / 2),
    cy * Math.sin((r * Math.PI) / 2),
  ],
  pinch: (cx, cy, r) => [cx * r * r, cy * r * r],
  bloat: (cx, cy, r) => [cx * Math.sqrt(r), cy * Math.sqrt(r)],
  wave: (cx, cy) => [
    cx + Math.sin(cy * 0.4) * 0.7,
    cy + Math.sin(cx * 0.4) * 0.7,
  ],
  punk: (cx, cy) => [
    cx + Math.sin(cx * 0.4) * 0.7,
    cy + Math.cos(cy * 0.4) * 0.7,
  ],
  swirl: (cx, cy, r, theta) => [
    cx + r * Math.cos(theta + r * 3),
    cy + r * Math.sin(theta + r * 3),
  ],
  swirl2: (_, __, r, theta) => [
    r * Math.cos(theta + r * 3),
    r * Math.sin(theta + r * 3),
  ],
};

const keys = Object.keys(distortionFunctions);
const randomKey = keys[
  Math.floor(Math.random() * keys.length)
] as DistortionType;
// const method = distortionFunctions[randomKey];

export const makeTrigonometryGenerator = (
  seed: number,
  distortionType?: DistortionType
) => {
  return (coord: Coord): number => {
    const { x, y } = coord;
    const lineFrequency = 1;

    const method = distortionFunctions[distortionType ?? randomKey];

    const cx = x / 4 - 20;
    const cy = y / 4 - 10;

    const r = Math.sqrt(cx * cx + cy * cy) / 8;
    const theta = Math.atan2(cy, cx);

    const [distortedX, distortedY] = method(cx, cy, r, theta);

    const value =
      Math.sin(distortedX * lineFrequency + seed) *
      Math.sin(distortedY * lineFrequency + seed);

    return Math.abs(value);
  };
};
