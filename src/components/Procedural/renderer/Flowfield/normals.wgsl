@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;

@vertex fn vsNorm(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

fn sampleHeight(uv: vec2<f32>) -> f32 {
  return textureSample(bgTex, samp2, uv).r;
}

@fragment fn fsNorm(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let px = vec2f(1.0 / data.width, 1.0 / data.height);
  let hL = sampleHeight(uv - vec2f(px.x, 0.0));
  let hR = sampleHeight(uv + vec2f(px.x, 0.0));
  let hD = sampleHeight(uv - vec2f(0.0, px.y));
  let hU = sampleHeight(uv + vec2f(0.0, px.y));
  let dx = hR - hL;
  let dy = hU - hD;
  let n = normalize(vec3f(-dx, -dy, 1.0));
  return vec4f(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0);
}