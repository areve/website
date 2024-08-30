export type Point = { x: number; y: number };

// Function to compute the value of a cubic Bezier curve at a given t
export function cubicBezier(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const p = {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };

    return p;
}

// Example usage
const p0: Point = { x: 0, y: 0 };   // Start point
const p1: Point = { x: 0.3, y: 0.7 }; // Control point 1 (Adjustable)
const p2: Point = { x: 0.7, y: 0.3 }; // Control point 2 (Adjustable)
const p3: Point = { x: 1, y: 1 };   // End point

// Calculate the curve points
const steps = 100;
const curvePoints: Point[] = [];

for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    curvePoints.push(cubicBezier(t, p0, p1, p2, p3));
}

console.log(curvePoints);