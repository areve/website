@vertex fn vs(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
  let pos = array(
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, 1.0) ,
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, -1.0)
  );

  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  // map fragment position to world coordinates used by the noise function
  // use the same center/scale/rotation math as setupOpenSimplexRenderer.ts
  let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
  let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;

  // Sample height and use centered finite differences for derivatives.
  // Rotate the pixel coords around the view center by +theta (R) so the
  // OpenSimplex sampling matches the standalone renderer.
  let eps: f32 = 0.25;
  let cx = (data.width * 0.5) / data.scale * data.zoom + data.x / data.scale;
  let cy = (data.height * 0.5) / data.scale * data.zoom + data.y / data.scale;
  let c = cos(data.rotation);
  let s = sin(data.rotation);

  // apply precomputed sampling transform (maps world -> rotated sampling coords)
  let rx = data.a00 * baseX + data.a01 * baseY + data.bx;
  let ry = data.a10 * baseX + data.a11 * baseY + data.by;

  let n = openSimplex3d(rx, ry, data.z);
  let nxp = openSimplex3d(rx + eps, ry, data.z);
  let nxm = openSimplex3d(rx - eps, ry, data.z);
  let nyp = openSimplex3d(rx, ry + eps, data.z);
  let nym = openSimplex3d(rx, ry - eps, data.z);
  let derx_r = (nxp - nxm) / (2.0 * eps);
  let dery_r = (nyp - nym) / (2.0 * eps);
  // rotate derivatives from sampling (rotated) coords back into world coords using R^T
  let derx = derx_r * c + dery_r * s;
  let dery = -derx_r * s + dery_r * c;

  // Compute surface normal with Z as the up axis so we can test angle vs Z.
  // normal = (-dz/dx, -dz/dy, 1)
  let normal = normalize(vec3f(-derx, -dery, 1.0));

  // Use the raw height as the base color (white ramp)
  let heightColor = vec3f(n);
  // compute slope magnitude and heading to tint by facing direction
  let slopeMag = length(vec2f(derx, dery));
  let heading: f32 = atan2(derx, dery);
  let hue: f32 = fract(heading / (2.0 * PI) + 1.0);
  // Map saturation from surface angle: flat (normal.z ~= 1.0) -> 0, vertical (normal.z ~= 0.0) -> 1
  // Increase sensitivity so steeper faces get stronger tint.
  let sat: f32 = clamp((1.0 - normal.z) * angleSaturationScale, 0.0, 1.0);
  // Set HSV value (brightness) to the height so valleys are 0 and peaks are 1
  let tintRGB = hsv2rgb(vec3f(hue, sat, n));
  let tintWeight: f32 = sat * tintStrength;
  let lit = heightColor * (1.0 - tintWeight) + tintRGB * tintWeight;

  // Return the lit color directly (remove debug peak/trough overlay markers)
  return vec4<f32>(lit, 1.0);
}
