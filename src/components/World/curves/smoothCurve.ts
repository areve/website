import { clamp } from "../lib/other";
import { Point } from "./cubicBezier";

export function linearCurve(x: number, points: Point[]): number {
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

// Function to calculate a point on a cubic Hermite spline
function hermite(t: number, p0: Point, p1: Point, m0: Point, m1: Point): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h01 = -2 * t3 + 3 * t2;
  const h10 = t3 - 2 * t2 + t;
  const h11 = t3 - t2;

  const x = h00 * p0.x + h01 * p1.x + h10 * m0.x + h11 * m1.x;
  const y = h00 * p0.y + h01 * p1.y + h10 * m0.y + h11 * m1.y;

  return { x, y };
}

// Function to generate a smooth curve using Cubic Hermite splines
function generateHermiteCurve(points: Point[], segments: number = 10): Point[] {
  const result: Point[] = [];

  // Ensure we have at least 2 points to fit a curve
  if (points.length < 2) {
      throw new Error("At least two points are required.");
  }

  // Generate Hermite curves between each pair of points
  for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      // Compute tangents for the start and end points
      const m0 = i === 0 ? { x: (p1.x - p0.x) / 2, y: (p1.y - p0.y) / 2 } : {
          x: (points[i + 1].x - points[i - 1].x) / 2,
          y: (points[i + 1].y - points[i - 1].y) / 2
      };
      const m1 = i === points.length - 2 ? { x: (p1.x - p0.x) / 2, y: (p1.y - p0.y) / 2 } : {
          x: (points[i + 2].x - points[i].x) / 2,
          y: (points[i + 2].y - points[i].y) / 2
      };

      // Generate points for the Hermite spline segment
      for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const point = hermite(t, p0, p1, m0, m1);
          result.push(point);
      }
  }

  return result;
}

export function smoothCurve(x: number, points: Point[], steps: number = 15): number {
  const approx = generateHermiteCurve(points, steps);
  return linearCurve(x, approx);
}
