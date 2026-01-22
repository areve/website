struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  frame: f32,
  zoom: f32,
  rotation: f32
};

@group(0) @binding(0) var<uniform> data: Uniforms;

// --- Shared coordinate helpers (pixel <-> world, wrapping) ---
fn pixelToWorld(px: vec2<f32>, width: f32, height: f32) -> vec2<f32> {
  let center = vec2f((width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let baseX = px.x / data.scale * data.zoom + data.x / data.scale;
  let baseY = px.y / data.scale * data.zoom + data.y / data.scale;
  let rel = vec2f(baseX - center.x, baseY - center.y);
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let rotX = rel.x * cos_r - rel.y * sin_r;
  let rotY = rel.x * sin_r + rel.y * cos_r;
  return vec2f(rotX + center.x, rotY + center.y);
}

fn worldToPixel(p: vec2<f32>, width: f32, height: f32) -> vec2<f32> {
  let center = vec2f((width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let d = p - center;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  return dprime * (data.scale / data.zoom) + vec2f(width / 2.0, height / 2.0);
}

