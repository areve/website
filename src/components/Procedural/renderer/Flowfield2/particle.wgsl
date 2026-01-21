struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) alpha: f32,
};

@vertex fn vs(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vi: u32) -> VSOut {
  let quad = array<vec2<f32>, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
  );
  let q = quad[vi];
  let size = vec2f(sim.size, sim.size);

  // Read the instance position from the read-only storage alias so the vertex
  // stage doesn't access a read-write storage buffer.
  let instancePos = positionsRead[instanceIndex];
  let coord = worldToPixel(instancePos, data.width, data.height);

  let pixelPos = coord + q * size;
  let ndc = (pixelPos / vec2f(data.width, data.height)) * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);

  var out: VSOut;
  out.pos = vec4<f32>(ndc.x, ndc.y, 0.0, 1.0);
  out.alpha = alphasRead[instanceIndex];
  return out;
}

@fragment fn fs(@location(0) alpha: f32) -> @location(0) vec4<f32> {
  // Particle color controlled by Sim uniform with per-instance alpha;
  // multiply per-instance alpha by sim.color.w so the uniform alpha scales visibility
  let outAlpha: f32 = sim.color.w * alpha;
  // Output premultiplied RGB so the particle render pass can use premultiplied blending.
  return vec4<f32>(sim.color.x * outAlpha, sim.color.y * outAlpha, sim.color.z * outAlpha, outAlpha);
}

struct Sim {
  dt: f32,
  speed: f32,
  damping: f32,
  width: f32,
  height: f32,
  maxLife: f32,
  seed: f32,
  fadeIn: f32,
  fadeOut: f32,
  size: f32,
  maxDelayTime: f32,
  color: vec4<f32>,
};
@group(0) @binding(1) var normalsTex: texture_2d<f32>;
// Compute shader needs a read-write storage buffer for positions, but the vertex stage
// can only access storage buffers as read-only. Provide both: a read-write `positions`
// for the compute stage and a read-only alias `positionsRead` used by the vertex shader.
@group(0) @binding(2) var<storage, read_write> positions: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> positionsRead: array<vec2<f32>>;
@group(0) @binding(3) var<storage, read_write> lifetimes: array<f32>;
// states: 0.0 = waiting to spawn, 1.0 = alive
@group(0) @binding(5) var<storage, read_write> states: array<f32>;
@group(0) @binding(6) var<storage, read_write> alphas: array<f32>;
@group(0) @binding(7) var<storage, read> alphasRead: array<f32>;
@group(0) @binding(8) var<storage, read_write> velocities: array<vec2<f32>>;
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
      // start invisible; alpha will ramp up in subsequent updates
      alphas[idx] = 0.0;
      positions[idx] = p;
    } else {
      // still waiting, leave position unchanged and keep alpha zero
      positions[idx] = p;
      alphas[idx] = 0.0;
    }
    return;
  }

  // If alive, and lifetime expired -> schedule respawn after random delay
  if (lifetimes[idx] <= 0.0) {
    let delay = noise(vec4<f32>(f32(idx), 123.456, 654.321, sim.seed + 2.0)) * sim.maxDelayTime;
    lifetimes[idx] = delay;
    states[idx] = 0.0;
    // clear alpha so when waiting the particle is invisible
    alphas[idx] = 0.0;
    positions[idx] = p;
    return;
  }

  // Convert world-space particle position into screen UVs to sample the normals
  let coord = worldToPixel(p, sim.width, sim.height);
  let uv = coord / vec2f(sim.width, sim.height);

  // Fade parameters (controlled by Sim uniform)
  let fadeIn = sim.fadeIn; // seconds - quick fade in
  let fadeOut = sim.fadeOut; // seconds - slow fade out

  // Simple nearest-neighbor sample the normals texture
  let tx = uv.x * sim.width;
  let ty = uv.y * sim.height;
  let ix = i32(clamp(floor(tx), 0.0, sim.width - 1.0));
  let iy = i32(clamp(floor(ty), 0.0, sim.height - 1.0));
  let c = textureLoad(normalsTex, vec2<i32>(ix, iy), 0).xyz;
  let nx = c.x * 2.0 - 1.0;
  let ny = c.y * 2.0 - 1.0;
  // Sampled normals are in texture/screen space; rotate by -data.rotation
  // to convert them into world-space flow directions (undo double-rotation).
  let sample = vec2f(nx, ny);
  let cos_r = -cos(data.rotation);
  let sin_r = sin(data.rotation);
  let flow = vec2f(sample.x * cos_r + sample.y * sin_r, -sample.x * sin_r + sample.y * cos_r);

  // Update velocity with acceleration from flow and damping for inertia
  var v = velocities[idx];
  let acceleration = -flow * sim.speed; // acceleration in direction of flow
  v = v * (1.0 - sim.damping * sim.dt) + acceleration * sim.dt; // damping + acceleration
  velocities[idx] = v;

  // Update position based on velocity
  p = p + v * sim.dt;

  // If pixel coords fall outside the viewport, mark the particle dead so it
  // will respawn randomly next frame instead of wrapping.
  var coord2 = worldToPixel(p, sim.width, sim.height);
  if (coord2.x < 0.0 || coord2.x >= sim.width || coord2.y < 0.0 || coord2.y >= sim.height) {
    // schedule respawn after a random delay in [0, sim.maxDelayTime] and mark as waiting
    let delay = noise(vec4<f32>(f32(idx), 123.456, 654.321, sim.seed + 2.0)) * sim.maxDelayTime;
    lifetimes[idx] = delay;
    // mark state as waiting (0.0) so the spawn logic will run after the delay
    states[idx] = 0.0;
    // reset velocity on respawn
    velocities[idx] = vec2f(0.0, 0.0);
    positions[idx] = p;
    return;
  }
  p = pixelToWorld(coord2, sim.width, sim.height);

  // Compute alpha based on time alive: fade in quickly, fade out slowly
  let lifeRemaining = lifetimes[idx];
  let lifeLived = sim.maxLife - lifeRemaining;
  let inAlpha = min(1.0, lifeLived / fadeIn);
  var outAlpha: f32 = 1.0;
  if (lifeRemaining < fadeOut) {
    outAlpha = lifeRemaining / fadeOut;
  }
  alphas[idx] = inAlpha * outAlpha;

  positions[idx] = p;
}
