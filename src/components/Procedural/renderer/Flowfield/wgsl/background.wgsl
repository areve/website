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
  let scl = safeScale();
  let x = coord.x / scl * data.zoom + data.x / scl;
  let y = coord.y / scl * data.zoom + data.y / scl;

  // Sample height and use centered finite differences for derivatives.
  // Rotate the sampling coordinates around the view center by data.rotate
  // so panning works as expected when the field is rotated.
  let eps: f32 = 0.25;
  let cx = data.x / scl + (data.width * 0.5) / scl * data.zoom;
  let cy = data.y / scl + (data.height * 0.5) / scl * data.zoom;
  let c = cos(data.rotation);
  let s = sin(data.rotation);
  
  // rotate sampling coords by -theta (R^T)
  let rx = (x - cx) * c + (y - cy) * s + cx;
  let ry = -(x - cx) * s + (y - cy) * c + cy;

  let n = openSimplex3d(rx, ry, data.z);
  let nxp = openSimplex3d(rx + eps, ry, data.z);
  let nxm = openSimplex3d(rx - eps, ry, data.z);
  let nyp = openSimplex3d(rx, ry + eps, data.z);
  let nym = openSimplex3d(rx, ry - eps, data.z);
  let derx_r = (nxp - nxm) / (2.0 * eps);
  let dery_r = (nyp - nym) / (2.0 * eps);
  // rotate derivatives back into world coordinates using R
  let derx = derx_r * c - dery_r * s;
  let dery = derx_r * s + dery_r * c;

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
