type Point = {
  x: number;
  y: number;
};
// Function to calculate the distance from a point to a line
export function distanceFromPointToLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  // Extract the coordinates of the points
  const { x: x0, y: y0 } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;

  // Calculate the components of the line's direction vector
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Calculate the distance using the formula
  const numerator = Math.abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx * dx + dy * dy);

  // Return the distance
  return numerator / denominator;
}
