import { clamp } from "../lib/other";
import { Point } from "./cubicBezier";

function catmullRom1D(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  tension: number = 0
): number {
  // Break down the terms for clarity
  const a = 2 * p1; // Coefficient for p1
  const b = -p0 + p2; // Coefficient for t term
  const c = 2 * p0 - 5 * p1 + 4 * p2 - p3; // Coefficient for t^2 term
  const d = -p0 + 3 * p1 - 3 * p2 + p3; // Coefficient for t^3 term

  // Combine the terms using the Catmull-Rom formula
  return 0.5 * (a + b * t + c * t * t + d * t * t * t);
}

export function catmullRomCurve(x: number, points: Point[]): number {
  const n = points.length;

  let i = 0;
  while (i < n - 1 && x > points[i + 1].x) ++i;
  i = clamp(i, 0, n - 2);

  const p0 = points[i - 1] ?? {
    x: 2 * points[0].x - points[1].x,
    y: 2 * points[0].y - points[1].y,
  };
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[i + 2] ?? {
    x: 2 * points[n - 1].x - points[n - 2].x,
    y: 2 * points[n - 1].y - points[n - 2].y,
  };

  const t = (x - p1.x) / (p2.x - p1.x);

  return catmullRom1D(t, p0.y, p1.y, p2.y, p3.y, 0.5);
}
