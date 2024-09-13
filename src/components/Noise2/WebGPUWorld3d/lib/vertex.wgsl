struct VertexOutput {
  @builtin(position) Position: vec4f,
  @location(0) fragUV: vec2f,
  @location(1) fragPosition: vec4f,
}

struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  modelViewProjectionMatrix: mat4x4f,
};

@group(0) @binding(0) 
var<uniform> uniforms: Uniforms;

@vertex
fn main(
    @location(0) position: vec4f,
    @location(1) uv: vec2f
) -> VertexOutput {
    var output: VertexOutput;
    //output.Position = position;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.fragUV = uv;
    output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
    return output;
}