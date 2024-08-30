import { Point } from "./cubicBezier";

export function linearCurve(x: number, points: Point[]): number {
  const n = points.length;
  if (x <= points[0].x) return points[0].y;
  if (x >= points[n - 1].x) return points[n - 1].y;
  const i = points.findIndex((p) => x < p.x);
  const p0 = points[i - 1];
  const p1 = points[i];
  return p0.y + ((x - p0.x) / (p1.x - p0.x)) * (p1.y - p0.y);
}

// Function to calculate a point on a cubic Hermite spline
function hermite(t: number, p0: Point, p1: Point, m0: Point, m1: Point): Point {
  const h00 = 2 * t * t * t - 3 * t * t + 1;
  const h01 = -2 * t * t * t + 3 * t * t;
  const h10 = t * t * t - 2 * t * t + t;
  const h11 = t * t * t - t * t;
  const x = h00 * p0.x + h01 * p1.x + h10 * m0.x + h11 * m1.x;
  const y = h00 * p0.y + h01 * p1.y + h10 * m0.y + h11 * m1.y;
  return { x, y };
}

// Function to generate a smooth curve using Cubic Hermite splines
function generateHermiteCurve(points: Point[], segments: number): Point[] {
  if (points.length < 2) throw new Error("At least two points are required.");

  // Calculate the Hermite curves for each segment
  const segmentData = points.slice(0, -1).map((p0, i) => {
    const p1 = points[i + 1];
    const pPrev = points[i - 1] || p0;
    const pNext = points[i + 2] || p1;
    const m0 = { x: (p1.x - pPrev.x) / 2, y: (p1.y - pPrev.y) / 2 };
    const m1 = { x: (pNext.x - p0.x) / 2, y: (pNext.y - p0.y) / 2 };
    return { p0, p1, m0, m1 };
  });

  // Generate Hermite curve points for each segment
  const tValues = Array.from({ length: segments + 1 }, (_, i) => i / segments);
  return segmentData.flatMap(({ p0, p1, m0, m1 }) =>
    tValues.map((t) => hermite(t, p0, p1, m0, m1))
  );
}

export function smoothCurve(
  x: number,
  points: Point[],
  segments?: number
): number {
  const approx = generateHermiteCurve(
    points,
    segments === undefined ? points.length * 3 : segments
  );
  approx.sort((a, b) => a.x - b.x);
  return linearCurve(x, approx);
}

export function makeSmoothCurveFunction(points: Point[], steps?: number) {
  const approx = generateHermiteCurve(
    points,
    steps === undefined ? points.length * 3 : steps
  );
  approx.sort((a, b) => a.x - b.x);
  return (x: number) => linearCurve(x, approx);
}
