@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var prevTex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> curr: Uniforms;
@group(0) @binding(3) var<uniform> prev: Uniforms;
@group(0) @binding(4) var<uniform> params: vec4<f32>;
@group(0) @binding(5) var<uniform> trailColor: vec4<f32>;

fn pixelToWorldU(px: vec2<f32>, u: Uniforms) -> vec2<f32> {
  let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                     (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
  let baseX = px.x / u.scale * u.zoom + u.x / u.scale;
  let baseY = px.y / u.scale * u.zoom + u.y / u.scale;
  let rel = vec2f(baseX - center.x, baseY - center.y);
  let cos_r = cos(u.rotation);
  let sin_r = sin(u.rotation);
  let rotX = rel.x * cos_r - rel.y * sin_r;
  let rotY = rel.x * sin_r + rel.y * cos_r;
  return vec2f(rotX + center.x, rotY + center.y);
}

fn worldToPixelU(p: vec2<f32>, u: Uniforms) -> vec2<f32> {
  let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                     (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
  let d = p - center;
  let cos_r = cos(u.rotation);
  let sin_r = sin(u.rotation);
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  return dprime * (u.scale / u.zoom) + vec2f(u.width / 2.0, u.height / 2.0);
}

@vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fsFade(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let pixel = coord.xy;
  let world = pixelToWorldU(pixel, curr);
  let prevPx = worldToPixelU(world, prev);

  let uv = prevPx / vec2<f32>(prev.width, prev.height);
  let uvClamped = clamp(uv, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
  let sampled = textureSample(prevTex, samp, uvClamped);
  var inside: f32 = 0.0;
  if (uv.x >= 0.0 && uv.x < 1.0 && uv.y >= 0.0 && uv.y < 1.0) {
    inside = 1.0;
  }
  let prevCol = sampled * inside;

  // Compute decay based on number of frames elapsed between `prev` and `curr`.
  // If no frames elapsed (paused), decay is zero.
  let framesDelta = max(curr.frame - prev.frame, 0.0);
  let DECAY = framesDelta * (1.0 / params.x / 60.0);
  let newA = max(prevCol.a - DECAY, 0.0);
  var newRgb = vec3<f32>(0.0, 0.0, 0.0);
  if (prevCol.a > 0.0) {
    newRgb = prevCol.rgb * (newA / prevCol.a);
  }
  return vec4<f32>(newRgb, newA);
}

@group(0) @binding(1) var pTex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> addTrailColor: vec4<f32>;
@group(0) @binding(3) var<uniform> addCurr: Uniforms;

@fragment fn fsAdd(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = coord.xy / vec2<f32>(addCurr.width, addCurr.height);
  let p = textureSample(pTex, samp, uv);
  let a = p.a * addTrailColor.w;
  let col = vec3<f32>(addTrailColor.x, addTrailColor.y, addTrailColor.z) * a;
  return vec4<f32>(col, a);
}
