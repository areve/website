export async function setupMountainsRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 8,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotation: 0,
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        this.rotation,
      ]);
    },
  };

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    label: "mountains shader",
    code: /* wgsl */ `      
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
        let sx: f32 = x;
        let sy: f32 = y;
        let sz: f32 = z;
        let skew: f32 = (sx + sy + sz) * skew3d;
        let ix: i32 = i32(floor(sx + skew));
        let iy: i32 = i32(floor(sy + skew));
        let iz: i32 = i32(floor(sz + skew));
        let fx: f32 = sx + skew - f32(ix);
        let fy: f32 = sy + skew - f32(iy);
        let fz: f32 = sz + skew - f32(iz);

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }

      fn vertexContribution(
        ix: i32, iy: i32, iz: i32,
        fx: f32, fy: f32, fz: f32,
        cx: i32, cy: i32, cz: i32
      ) -> f32 {
        let dx: f32 = fx - f32(cx);
        let dy: f32 = fy - f32(cy);
        let dz: f32 = fz - f32(cz);
        let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
        let dxs: f32 = dx - skewedOffset;
        let dys: f32 = dy - skewedOffset;
        let dzs: f32 = dz - skewedOffset;

        let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

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
        // Calculate center of canvas in world coordinates
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
        
        // Six layers with specific purposes
        let layer1 = openSimplex3d(x * 0.005, y * 0.005, data.z);   // Global ocean/continent distribution
        let layer2 = openSimplex3d(x * 0.015, y * 0.015, data.z);   // Macro-biomes (desert, forest, ice, tropical)
        let layer3 = openSimplex3d(x * 0.05, y * 0.05, data.z);     // Detailed height (hills, valleys)
        let layer4 = openSimplex3d(x * 0.08, y * 0.08, data.z);     // Earth type (affects mountain colors only)
        let layer5 = openSimplex3d(x * 0.02, y * 0.02, data.z);     // Inland lakes and water bodies
        let layer6 = openSimplex3d(x * 0.3, y * 0.3, data.z);       // Fine detail height variation
        
        // Combine into elevation - layer1 is primary separator
        let oceanMask = layer1; // -0.5 to 0.5 range, determines if ocean or land
        let baseHeight = layer3 * 0.35 + layer6 * 0.08; // Increased base height for more dramatic terrain
        
        // Lakes only affect land areas (where oceanMask is positive)
        var lakeEffect = 0.0;
        if (oceanMask > 0.1) {
          lakeEffect = min(layer5 * 0.08, 0.0); // Reduced lake effect, only on land
        }
        
        // Combine: heavily weight oceanMask to get clean continents
        let rawHeight = oceanMask * 0.98 + baseHeight + lakeEffect - 0.35; // Quadruple oceans
        
        // Use simple non-linear scaling for more interesting terrain
        // Gentle power function to create some cliff/plateau variety without blobs
        let combined = sign(rawHeight) * pow(abs(rawHeight), 0.85); // Lower exponent for more height variation
        
        // Mountain height variation - some areas have tall mountains, others low
        let mountainHeightMod = openSimplex3d(x * 0.01, y * 0.01, data.z); // Even larger scale for mountain ranges
        
        // Use layer2 for biome (affects color palette) - smooth it for gradual transitions
        let biomeRaw = layer2;
        // Sample neighbors for smoothing to avoid sharp lines
        let biomeSmooth1 = openSimplex3d((x + 5.0) * 0.015, y * 0.015, data.z);
        let biomeSmooth2 = openSimplex3d(x * 0.015, (y + 5.0) * 0.015, data.z);
        let biome = (biomeRaw + biomeSmooth1 + biomeSmooth2) / 3.0; // Smoothed biome
        
        // Use layer4 for earth type (will affect mountains later)
        let earthType = layer4; // Range 0-1: volcanic, rocky, sandy, etc.
        
        // Determine terrain type based on elevation and biome
        // Earth proportions: ~71% ocean, 29% land (with beaches ~1%, mountains ~24%, ice ~10%)
        // Colors matched to Earth from space
        var color: vec3f;
        if (combined < 0.42) {
          // Deep water (~65% of Earth) - realistic ocean blues
          let depth = combined / 0.42; // 0 = deepest, 1 = shallowest
          color = mix(vec3f(0.02, 0.08, 0.20), vec3f(0.05, 0.15, 0.35), depth);
        } else if (combined < 0.455) {
          // Shallow water / continental shelf (~2% of Earth)
          let t = (combined - 0.42) / 0.035;
          color = mix(vec3f(0.05, 0.15, 0.35), vec3f(0.12, 0.28, 0.48), t);
        } else if (combined < 0.465) {
          // Beach/sand (~0.5% of Earth) - varies by biome smoothly
          let t = (combined - 0.455) / 0.01;
          let arcticSand = vec3f(0.70, 0.68, 0.60);  // Gray-white sand
          let temperateSand = vec3f(0.76, 0.70, 0.50); // Yellow-tan sand
          let tropicalSand = vec3f(0.88, 0.85, 0.70);  // White sand
          let desertSand = vec3f(0.82, 0.75, 0.55);    // Light tan sand
          
          // Smooth biome blending
          if (biome < 0.25) {
            color = mix(arcticSand, temperateSand, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateSand, tropicalSand, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalSand, desertSand, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertSand, arcticSand, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.58) {
          // Lowlands/plains (~10% of Earth) - Earth from space colors
          let t = (combined - 0.465) / 0.115;
          
          // Arctic tundra
          let arcticPlain = mix(vec3f(0.45, 0.50, 0.42), vec3f(0.38, 0.42, 0.35), t);
          // Temperate grassland - yellow-green
          let temperatePlain = mix(vec3f(0.52, 0.60, 0.35), vec3f(0.48, 0.55, 0.32), t);
          // Tropical savanna - vibrant green
          let tropicalPlain = mix(vec3f(0.35, 0.58, 0.28), vec3f(0.30, 0.52, 0.25), t);
          // Desert scrub - tan-brown
          let desertPlain = mix(vec3f(0.72, 0.62, 0.42), vec3f(0.68, 0.58, 0.38), t);
          
          // Smooth transitions
          if (biome < 0.25) {
            color = mix(arcticPlain, temperatePlain, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperatePlain, tropicalPlain, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalPlain, desertPlain, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertPlain, arcticPlain, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.68) {
          // Hills/forest (~40% of land) - realistic forest colors from space
          let t = (combined - 0.58) / 0.10;
          
          // Arctic: sparse conifer forest (dark green-gray)
          let arcticForest = mix(vec3f(0.32, 0.38, 0.30), vec3f(0.28, 0.34, 0.26), t);
          // Temperate: mixed/deciduous forest (medium green)
          let temperateForest = mix(vec3f(0.28, 0.45, 0.25), vec3f(0.24, 0.40, 0.22), t);
          // Tropical: rainforest (very dark green)
          let tropicalForest = mix(vec3f(0.15, 0.40, 0.18), vec3f(0.12, 0.32, 0.15), t);
          // Desert: rocky scrubland (brown-tan)
          let desertHills = mix(vec3f(0.58, 0.50, 0.35), vec3f(0.52, 0.45, 0.30), t);
          
          if (biome < 0.25) {
            color = mix(arcticForest, temperateForest, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateForest, tropicalForest, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalForest, desertHills, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertHills, arcticForest, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.74) {
          // Mountains/rock (~24% of land, ~7% of Earth) - lowered threshold for more mountains
          // Mountain height varies by region
          let mountainBase = 0.68;
          let mountainTop = 0.74 + mountainHeightMod * 0.12; // Taller in some regions
          var t = (combined - mountainBase) / (mountainTop - mountainBase);
          t = clamp(t, 0.0, 1.0);
          
          // Earth type determines rock color
          var mountainColor: vec3f;
          if (earthType < 0.33) {
            // Volcanic/dark rock (black-gray)
            mountainColor = mix(vec3f(0.25, 0.23, 0.22), vec3f(0.40, 0.38, 0.36), t);
          } else if (earthType < 0.66) {
            // Normal gray rock (Himalayas/Rockies style)
            mountainColor = mix(vec3f(0.42, 0.40, 0.38), vec3f(0.55, 0.52, 0.48), t);
          } else {
            // Sandy/sedimentary rock (Andes/desert mountains)
            mountainColor = mix(vec3f(0.58, 0.50, 0.38), vec3f(0.68, 0.58, 0.45), t);
          }
          
          // Biome affects mountain color slightly
          if (biome < 0.3) {
            // Arctic mountains - add slight blue tint
            mountainColor = mix(mountainColor, vec3f(0.45, 0.47, 0.50), 0.2);
          } else if (biome > 0.7) {
            // Desert mountains - add slight red-brown tint
            mountainColor = mix(mountainColor, vec3f(0.60, 0.48, 0.35), 0.15);
          }
          
          color = mountainColor;
        } else {
          // Snow/ice peaks (~10% of land, Antarctic/Greenland equivalent)
          let t = (combined - 0.74) / 0.26;
          // Pure white snow from space
          color = mix(vec3f(0.88, 0.90, 0.92), vec3f(0.95, 0.97, 0.98), t);
        }
        
        return vec4<f32>(color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "mountains pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "mountains renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
        zoom?: number;
        rotation?: number;
      }
    ) {
      Object.assign(sharedData, data);
    //   sharedData.z = time * 0.00005;
      sharedData.z = 9;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "mountains encoder",
      });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
