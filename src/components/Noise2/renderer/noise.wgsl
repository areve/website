fn noise(coord: vec4<f32>) -> f32 {
  let n: u32 = bitcast<u32>(data.seed) +
    bitcast<u32>(coord.x * 374761393.0) +
    bitcast<u32>(coord.y * 668265263.0) +
    bitcast<u32>(coord.z * 1440662683.0) +
    bitcast<u32>(coord.w * 3865785317.0);
  let m: u32 = (n ^ (n >> 13)) * 1274126177;
  return f32(m) / f32(0xffffffff);
}