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
  let pixel = vec2f(coord.x, coord.y);
  let world = pixelToWorld(pixel, data.width, data.height);
  let n = openSimplex3d(world.x, world.y, data.z);
  return vec4<f32>(n, n, n, 1.0);
}