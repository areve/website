struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  rotation: f32
};

@group(0) @binding(0) var<uniform> data: Uniforms;