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
  let scl = safeScale();
  let px = (p.x - data.x / scl) * scl / data.zoom;
  let ndcx = (px / data.width) * 2.0 - 1.0;
  let py = (p.y - data.y / scl) * scl / data.zoom;
  let ndcy = -((py / data.height) * 2.0 - 1.0);
  let halfX = f32(${PARTICLE_PIXEL_SIZE}) / data.width;
  let halfY = f32(${PARTICLE_PIXEL_SIZE}) / data.height;
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
