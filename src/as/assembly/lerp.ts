export function lerp(a: f64, b: f64, weight: f64): f64 {
  return a + weight * (b - a);
}

export function angleDiff(a: f64, b: f64): f64 {
  let diff = (b - a) % 360;
  if (diff > 180) diff = -360 + diff;
  else if (diff < -180) diff = 360 + diff;
  return diff;
}

export function angleLerp(a: f64, b: f64, weight: f64): f64 {
  return a + weight * angleDiff(a, b);
}
