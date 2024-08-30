type Point = {
  x: number;
  y: number;
};

export function distanceFromPointToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  // Extract the coordinates of the points
  const { x: px, y: py } = point;
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;

  // Compute the squared length of the line segment
  const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

  if (lineLengthSquared === 0) {
    // The line segment is just a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Compute the projection of the point onto the line segment
  const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLengthSquared;

  // Clamp t to the range [0, 1] to ensure the projection is on the segment
  const clampedT = Math.max(0, Math.min(1, t));

  // Compute the coordinates of the projected point
  const projectionX = x1 + clampedT * (x2 - x1);
  const projectionY = y1 + clampedT * (y2 - y1);

  // Compute the distance between the point and the projected point
  const dx = px - projectionX;
  const dy = py - projectionY;
  
  return Math.sqrt(dx * dx + dy * dy);
}