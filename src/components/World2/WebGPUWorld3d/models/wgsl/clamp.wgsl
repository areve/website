fn clamp(value: f32, low: f32, high: f32) -> f32 {
  return min(max(value, low), high);
}
  