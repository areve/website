fn noise(coord: vec4<f32>) -> f32 {
  // integer-hash-based noise: quantize coordinate components and mix with seed
  let q: u32 = u32(floor(coord.x * 4096.0));
  let r: u32 = u32(floor(coord.y * 4096.0));
  let s: u32 = u32(floor(coord.z * 4096.0));
  let t: u32 = u32(floor(coord.w * 4096.0));
  // Mix coordinates into a 32-bit integer using large primes, add uint seed
  let n: u32 = data.seed + q * 374761393u + r * 668265263u + s * 1440662683u + t * 3865785317u;
  let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
  return f32(m) * (1.0 / 4294967295.0);
}
