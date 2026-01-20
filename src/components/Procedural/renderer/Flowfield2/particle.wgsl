@vertex fn vs(@location(0) instancePos: vec2<f32>, @builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  let quad = array<vec2<f32>, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
  );
  let q = quad[vi];
  let size = vec2f(4.0, 4.0);

  // instancePos is stored in WORLD coordinates now. Convert back to screen pixel
  // coordinates using the same mapping as the background shader so particles
  // move/rotate/zoom with the background.
  let center = vec2f((data.width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let d = instancePos - center;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  // inverse rotation (world -> screen relative)
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  let coord = dprime * (data.scale / data.zoom) + vec2f(data.width / 2.0, data.height / 2.0);

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
@group(0) @binding(4) var<uniform> sim: Sim;

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx: u32 = gid.x;
  let count: u32 = arrayLength(&positions);
  if (idx >= count) { return; }
  var p = positions[idx];
  // update lifetime
  lifetimes[idx] = lifetimes[idx] - sim.dt;
  if (lifetimes[idx] <= 0.0) {
    // spawn uniformly across the VIEWPORT in pixel space then convert to
    // WORLD coordinates using the same transform as the background
    let r1 = noise(vec4<f32>(f32(idx), 12.989, 18.111, sim.seed));
    let r2 = noise(vec4<f32>(f32(idx), 78.233, 99.234, sim.seed + 1.0));
    let spawnPx = vec2f(r1 * sim.width, r2 * sim.height);

    let center = vec2f((sim.width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                       (sim.height / 2.0) / data.scale * data.zoom + data.y / data.scale);
    let baseX = spawnPx.x / data.scale * data.zoom + data.x / data.scale;
    let baseY = spawnPx.y / data.scale * data.zoom + data.y / data.scale;
    let relX = baseX - center.x;
    let relY = baseY - center.y;
    let cos_r_s = cos(data.rotation);
    let sin_r_s = sin(data.rotation);
    let rotX = relX * cos_r_s - relY * sin_r_s;
    let rotY = relX * sin_r_s + relY * cos_r_s;
    p = vec2f(rotX + center.x, rotY + center.y);

    lifetimes[idx] = sim.maxLife;
    positions[idx] = p;
    return;
  }

  // Convert world-space particle position into screen UVs to sample the normals
  let center = vec2f((sim.width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (sim.height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let d = p - center;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  // inverse rotation (world -> screen relative coords)
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  let coord = dprime * (data.scale / data.zoom) + vec2f(sim.width / 2.0, sim.height / 2.0);
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
  let pixelToWorld = (1.0 / data.scale) * data.zoom;
  p = p + flow * sim.speed * sim.dt * pixelToWorld;

  // Wrap using screen/pixel coordinates so wrapping follows rotation
  let d2 = p - center;
  let dprime2 = vec2f(d2.x * cos_r + d2.y * sin_r, -d2.x * sin_r + d2.y * cos_r);
  var coord2 = dprime2 * (data.scale / data.zoom) + vec2f(sim.width / 2.0, sim.height / 2.0);
  if (coord2.x < 0.0) { coord2.x = coord2.x + sim.width; }
  if (coord2.x >= sim.width) { coord2.x = coord2.x - sim.width; }
  if (coord2.y < 0.0) { coord2.y = coord2.y + sim.height; }
  if (coord2.y >= sim.height) { coord2.y = coord2.y - sim.height; }
  // convert back to world-space
  let worldRel = (coord2 - vec2f(sim.width / 2.0, sim.height / 2.0)) * (data.zoom / data.scale);
  let relXw = worldRel.x * cos_r - worldRel.y * sin_r;
  let relYw = worldRel.x * sin_r + worldRel.y * cos_r;
  p = vec2f(relXw + center.x, relYw + center.y);

  positions[idx] = p;
}
