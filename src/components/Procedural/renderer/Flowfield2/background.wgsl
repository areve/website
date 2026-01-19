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
    // Calculate center in world coordinates
    let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
    let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
    
    // Convert pixel to world coordinates
    let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
    let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
    
    // Translate to origin (relative to center)
    let relX = baseX - centerX;
    let relY = baseY - centerY;
    
    // Apply rotation around center
    let cos_r = cos(data.rotation);
    let sin_r = sin(data.rotation);
    let rotX = relX * cos_r - relY * sin_r;
    let rotY = relX * sin_r + relY * cos_r;
    
    // Translate back
    let x = rotX + centerX;
    let y = rotY + centerY;
    
    let n = openSimplex3d(x, y, data.z);
    
    return vec4<f32>(n, n, n, 1.0);
  }