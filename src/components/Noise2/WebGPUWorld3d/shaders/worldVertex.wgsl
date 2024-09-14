struct VertexOutput {
  @builtin(position) Position: vec4f,
  @location(0) fragUV: vec2f,
  @location(1) fragPosition: vec4f,
  @location(2) face: vec2f,
}

struct Uniforms {
  modelViewProjectionMatrix: mat4x4f
};

@group(1) @binding(0) 
var<uniform> uniforms: Uniforms;

@vertex
fn main(
    @location(0) position: vec4f,
    @location(1) uv: vec2f,
    @location(2) face: vec2f,
) -> VertexOutput {
    var output: VertexOutput;
    //output.Position = position;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.fragUV = uv;
    output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
    output.face = face;
    return output;
}