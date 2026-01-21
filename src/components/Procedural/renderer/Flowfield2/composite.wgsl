@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;
@group(0) @binding(3) var pTex: texture_2d<f32>;
@group(0) @binding(4) var trailsTex: texture_2d<f32>;

@vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fsBlit(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let bg = textureSample(bgTex, samp2, uv);
  let p = textureSample(pTex, samp2, uv);
  let t = textureSample(trailsTex, samp2, uv);
  // simple alpha overlay: out = bg*(1-a) + p.rgb*a
  // compose: background -> trails -> particles
  let mid = bg.rgb * (1.0 - t.a) + t.rgb * t.a;
  let out = mid * (1.0 - p.a) + p.rgb * p.a;
  return vec4f(out, 1.0);
}