@vertex fn vs(@location(0) instancePos: vec2<f32>, @builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  let quad = array<vec2<f32>, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
  );
  let q = quad[vi];
  let size = vec2f(4.0, 4.0);
  let pixelPos = instancePos + q * size;
  let ndc = (pixelPos / vec2f(data.width, data.height)) * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
  return vec4f(ndc, 0.0, 1.0);
}

@fragment fn fs() -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 0.0, 1.0);
}

struct Sim { dt: f32, speed: f32, width: f32, height: f32, maxLife: f32, seed: f32 };
@group(0) @binding(1) var normalsTex: texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> positions: array<vec2<f32>>;
@group(0) @binding(3) var<storage, read_write> lifetimes: array<f32>;
@group(0) @binding(4) var<uniform> sim: Sim;

fn hashf(x: f32) -> f32 {
  return fract(sin(x) * 43758.5453123);
}

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx: u32 = gid.x;
  let count: u32 = arrayLength(&positions);
  if (idx >= count) { return; }
  var p = positions[idx];
  // update lifetime
  lifetimes[idx] = lifetimes[idx] - sim.dt;
  if (lifetimes[idx] <= 0.0) {
    let r1 = hashf(f32(idx) * 12.9898 + sim.seed);
    let r2 = hashf(f32(idx) * 78.233 + sim.seed + 1.0);
    p = vec2f(r1 * sim.width, r2 * sim.height);
    lifetimes[idx] = sim.maxLife;
    positions[idx] = p;
    return;
  }

  let uv = p / vec2f(sim.width, sim.height);
  let ix = i32(floor(uv.x * sim.width));
  let iy = i32(floor(uv.y * sim.height));
  let ncol = textureLoad(normalsTex, vec2<i32>(ix, iy), 0).xyz;
  let nx = ncol.x * 2.0 - 1.0;
  let ny = ncol.y * 2.0 - 1.0;
  let flow = vec2f(nx, ny);
  p = p + flow * sim.speed * sim.dt;
  if (p.x < 0.0) { p.x = p.x + sim.width; }
  if (p.x >= sim.width) { p.x = p.x - sim.width; }
  if (p.y < 0.0) { p.y = p.y + sim.height; }
  if (p.y >= sim.height) { p.y = p.y - sim.height; }
  positions[idx] = p;
}
