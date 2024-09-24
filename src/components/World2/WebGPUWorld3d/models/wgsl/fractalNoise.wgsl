#include openSimplex3d;

fn fractalNoise(seed: f32, x: f32, y: f32, z: f32, numLayers: u32) -> f32 {
  var total: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var frequency: f32 = 1.0;
  var maxAmplitude: f32 = 0.0;

  for (var i: u32 = 0; i < numLayers; i++) {
    let noise = openSimplex3d(
      seed * f32(i * 10000 + 12345),
      x * (frequency), y * (frequency), z * (frequency)
    );

    total += noise * amplitude;
    maxAmplitude += amplitude;

    amplitude *= 0.35;
    frequency *= 4.0;
  }

  return total / maxAmplitude;
}