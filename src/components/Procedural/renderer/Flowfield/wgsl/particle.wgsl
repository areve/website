@group(0) @binding(1) var<storage, read> particles: array<vec3<f32>>;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) life: f32,
  @location(1) hueRand: f32,
};

@vertex fn vs(@builtin(vertex_index) vIndex: u32, @builtin(instance_index) iIndex: u32) -> VSOut {
  // 6 vertices per quad (two triangles)
  let corner = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, 1.0),
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, -1.0)
  );
    let p = particles[iIndex];
    // rotate particle world coords around the view center so they follow the background
    let cx = (data.width * 0.5) / data.scale * data.zoom + data.x / data.scale;
    let cy = (data.height * 0.5) / data.scale * data.zoom + data.y / data.scale;
    let c = cos(data.rotation);
    let s = sin(data.rotation);
    let relX = p.x - cx;
    let relY = p.y - cy;
    // invert rotation sign so particle rotation matches the background orientation
    let rx = relX * c + relY * s + cx;
    let ry = -relX * s + relY * c + cy;
    // convert rotated world coords back to pixel-space for NDC mapping
    let pixelX = (rx * data.scale - data.x) / data.zoom;
    let pixelY = (ry * data.scale - data.y) / data.zoom;
    let ndcx = (pixelX / data.width) * 2.0 - 1.0;
    let ndcy = -((pixelY / data.height) * 2.0 - 1.0);
  let halfX = f32(${particlePixelSize}) / data.width;
  let halfY = f32(${particlePixelSize}) / data.height;
  let pos = vec2f(ndcx + corner[vIndex].x * halfX, ndcy + corner[vIndex].y * halfY);
  var out: VSOut;
  out.pos = vec4f(pos, 0.0, 1.0);
  out.life = p.z;
  // derive a small per-particle pseudo-random hue from world position/time so
  // dots have subtle color variation without changing buffer layout.
  // scale coords to decorrelate patterns and keep value in [0,1].
  out.hueRand = noise(vec4f(p.x * 12.989, p.y * 78.233, data.z, 0.0));
  return out;
}
@fragment fn fs(@location(0) life: f32, @location(1) hueRand: f32) -> @location(0) vec4f {
  // fade particle alpha by remaining life (assume life ~ up to 3.0s for normalization)
  let alpha = 0.30 * clamp(life / 3.0, 0.0, 1.0);
  // small hue tint blended toward a saturated color so variation is subtle
  let jitterAmt: f32 = 0.4;
  let hue = fract(hueRand) * 0.6 + 0.75;
  let tint = hsv2rgb(vec3f(hue, 0.8, 1.0));
  let base = vec3f(1.0, 1.0, 1.0);
  let col = base * (1.0 - jitterAmt) + tint * jitterAmt;
  return vec4f(col, alpha);
}
