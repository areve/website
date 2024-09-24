fn piecewiseCurve(t: f32, p: f32, s: f32) -> f32 {
  var c: f32;
  if s == 3.0 {
    c = 1e10;
  } else {
    c = (1.0 - s) / (s - 3.0);
  }

  if t < p {
    let n = t * (1.0 + c);
    let d = t + p * c;
    let r = n / d;
    return t * r * r;
  } else {
    let v = 1.0 - t;
    let n = v * (1.0 + c);
    let d = v + (1.0 - p) * c;
    let r = n / d;
    return 1.0 - v * r * r;
  }
}
  