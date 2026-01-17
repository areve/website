@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var prevTex: texture_2d<f32>;

@vertex fn vs2(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs2(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let prev = textureSample(prevTex, samp, uv);
  let fadeRGB = 0.995;
  let fadeA = 0.92;
  return vec4f(prev.xyz * fadeRGB, prev.w * fadeA);
}
