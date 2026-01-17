@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;
@group(0) @binding(3) var accTex: texture_2d<f32>;

@vertex fn vs3(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs3(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let bg = textureSample(bgTex, samp2, uv);
  let acc = textureSample(accTex, samp2, uv);
  let src = acc.rgb * acc.a;
  let one = vec3f(1.0, 1.0, 1.0);
  let outRgb = one - (one - bg.rgb) * (one - src);
  return vec4f(outRgb, 1.0);
}
