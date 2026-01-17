fn hsv2rgb(hsv: vec3f) -> vec3f {
  let h = hsv.x;
  let s = hsv.y;
  let v = hsv.z;
  let hue = (((h * 360.0) % 360.0) + 360.0) % 360.0;
  let sector = floor(hue / 60.0);
  let sectorFloat = hue / 60.0 - sector;
  let x = v * (1.0 - s);
  let y = v * (1.0 - s * sectorFloat);
  let z = v * (1.0 - s * (1.0 - sectorFloat));
  let rgb = array<f32, 10>(x, x, z, v, v, y, x, x, z, v);
  return vec3f(rgb[u32(sector) + 4], rgb[u32(sector) + 2], rgb[u32(sector)]);
}
