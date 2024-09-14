struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) fragPosition: vec4f,
  @location(2) face: vec2f,
}

struct Uniforms {
  transform: mat4x4f
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
    output.position = uniforms.transform * vec4f(position.xy, 0.0, 1.0);
    output.uv = uv;
    // TODO fragPosition is not being used, probably should be instead of face 
    output.fragPosition = (position + vec4(1.0, 1.0, 1.0, 1.0));
    output.face = face;
    return output;
}