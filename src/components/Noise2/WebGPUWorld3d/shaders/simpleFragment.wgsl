struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@fragment
fn main(
  @location(0) fragUV: vec2f,
  @location(1) fragPosition: vec4f
) -> @location(0) vec4f {
  let dummy = uniforms.seed;
  return vec4f(fragUV.xy, 0.0, 0.0);
}