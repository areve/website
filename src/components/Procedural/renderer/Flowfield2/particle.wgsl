@vertex fn vs(@location(0) instancePos: vec2<f32>, @builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  let quad = array<vec2<f32>, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
  );
  let q = quad[vi];
  let size = vec2f(2.0, 2.0);

  // instancePos is stored in WORLD coordinates now. Convert to screen pixel
  // coordinates using the shared helper so particles move/rotate/zoom with the background.
  let coord = worldToPixel(instancePos, data.width, data.height);

  let pixelPos = coord + q * size;
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
// states: 0.0 = waiting to spawn, 1.0 = alive
@group(0) @binding(5) var<storage, read_write> states: array<f32>;
@group(0) @binding(4) var<uniform> sim: Sim;

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx: u32 = gid.x;
  let count: u32 = arrayLength(&positions);
  if (idx >= count) { return; }
  var p = positions[idx];
  // update lifetime (counts down whether waiting or alive)
  lifetimes[idx] = lifetimes[idx] - sim.dt;
  let state = states[idx];

  // If waiting to spawn
  if (state < 0.5) {
    if (lifetimes[idx] <= 0.0) {
      // spawn uniformly across the VIEWPORT in pixel space then convert to
      // WORLD coordinates using the shared helper
      let r1 = noise(vec4<f32>(f32(idx), 12.989, 18.111, sim.seed));
      let r2 = noise(vec4<f32>(f32(idx), 78.233, 99.234, sim.seed + 1.0));
      let spawnPx = vec2f(r1 * sim.width, r2 * sim.height);
      p = pixelToWorld(spawnPx, sim.width, sim.height);
      lifetimes[idx] = sim.maxLife;
      states[idx] = 1.0;
      positions[idx] = p;
    } else {
      // still waiting, leave position unchanged
      positions[idx] = p;
    }
    return;
  }

  // If alive, and lifetime expired -> schedule respawn after random delay
  if (lifetimes[idx] <= 0.0) {
    let delay = noise(vec4<f32>(f32(idx), 123.456, 654.321, sim.seed + 2.0)) * sim.maxLife;
    lifetimes[idx] = delay;
    states[idx] = 0.0;
    positions[idx] = p;
    return;
  }

  // Convert world-space particle position into screen UVs to sample the normals
  let coord = worldToPixel(p, sim.width, sim.height);
  let uv = coord / vec2f(sim.width, sim.height);

  // Bilinear sample the normals texture to avoid sudden nearest-neighbour jumps
  let tx = uv.x * sim.width;
  let ty = uv.y * sim.height;
  let fx = fract(tx);
  let fy = fract(ty);
  let ix0 = i32(clamp(floor(tx), 0.0, sim.width - 1.0));
  let iy0 = i32(clamp(floor(ty), 0.0, sim.height - 1.0));
  let ix1 = i32(clamp(floor(tx) + 1.0, 0.0, sim.width - 1.0));
  let iy1 = i32(clamp(floor(ty) + 1.0, 0.0, sim.height - 1.0));
  let c00 = textureLoad(normalsTex, vec2<i32>(ix0, iy0), 0).xyz;
  let c10 = textureLoad(normalsTex, vec2<i32>(ix1, iy0), 0).xyz;
  let c01 = textureLoad(normalsTex, vec2<i32>(ix0, iy1), 0).xyz;
  let c11 = textureLoad(normalsTex, vec2<i32>(ix1, iy1), 0).xyz;
  let col0 = c00 * (1.0 - fx) + c10 * fx;
  let col1 = c01 * (1.0 - fx) + c11 * fx;
  let ncol = col0 * (1.0 - fy) + col1 * fy;
  let nx = ncol.x * 2.0 - 1.0;
  let ny = ncol.y * 2.0 - 1.0;
  let flow = vec2f(nx, ny);

  // Convert flow (which was in pixel-space units) into world-space units and update
  let pixelToWorldScale = (1.0 / data.scale) * data.zoom;
  p = p + flow * sim.speed * sim.dt * pixelToWorldScale;

  // If pixel coords fall outside the viewport, mark the particle dead so it
  // will respawn randomly next frame instead of wrapping.
  var coord2 = worldToPixel(p, sim.width, sim.height);
  if (coord2.x < 0.0 || coord2.x >= sim.width || coord2.y < 0.0 || coord2.y >= sim.height) {
    // schedule respawn after a random delay in [0, sim.maxLife]
    let delay = noise(vec4<f32>(f32(idx), 123.456, 654.321, sim.seed + 2.0)) * sim.maxLife;
    lifetimes[idx] = delay;
    positions[idx] = p;
    return;
  }
  p = pixelToWorld(coord2, sim.width, sim.height);

  positions[idx] = p;
}
