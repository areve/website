import { clamp } from "../lib/other";
import { Point } from "./cubicBezier";

// it's a bad function
export function smoothCurve(x: number, points: Point[]): number {
  // Sort points by x-coordinate
  points.sort((a, b) => a.x - b.x);

  // Handle cases where x is out of bounds
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;

  // Find the interval [x0, x1] in which x lies
  let x0 = points[0].x;
  let y0 = points[0].y;
  let x1 = points[1].x;
  let y1 = points[1].y;

  for (let i = 1; i < points.length; i++) {
    if (x < points[i].x) {
      x0 = points[i - 1].x;
      y0 = points[i - 1].y;
      x1 = points[i].x;
      y1 = points[i].y;
      break;
    }
  }

  // Linear interpolation
  const t = (x - x0) / (x1 - x0);
  const y = y0 + t * (y1 - y0);

  return y;
}
