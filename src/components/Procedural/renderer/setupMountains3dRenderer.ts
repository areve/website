import { createPerspectiveMatrix, createViewMatrix, multiplyMatrices } from "../lib/matrix";

interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

function createPlaneGeometry(
  size: number,
  segments: number
): { positions: Float32Array; colors: Float32Array; indices: Uint32Array } {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const step = size / segments;
  const half = size / 2;

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = -half + i * step;
      const z = -half + j * step;
      
      // Flat plane, heights computed in shader
      positions.push(x, 0, z);
      
      // Neutral color
      colors.push(0.5, 0.5, 0.5);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
}

export async function setupMountains3dRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number },
  controller2d?: any,
  controller3d?: any
) {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  // Create geometry
  const geometry = createPlaneGeometry(100, 50);
  const vertexBuffer = device.createBuffer({
    size: geometry.positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(geometry.positions);
  vertexBuffer.unmap();

  const colorBuffer = device.createBuffer({
    size: geometry.colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(colorBuffer.getMappedRange()).set(geometry.colors);
  colorBuffer.unmap();

  const indexBuffer = device.createBuffer({
    size: geometry.indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(geometry.indices);
  indexBuffer.unmap();

  const indexCount = geometry.indices.length;

  // Create uniform buffer for matrices and noise parameters
  const matrixBuffer = device.createBuffer({
    size: 192, // 2 matrices (16 floats each) + 10 floats (seed, scale, z, offsetX, offsetY, rotation, width, height + padding), 16-byte aligned
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Create shader module
  const module = device.createShaderModule({
    label: "3d mountains shader with opensimplex",
    code: /* wgsl */ `
      struct Matrices {
        projection: mat4x4f,
        view: mat4x4f,
        seed: f32,
        scale: f32,
        z: f32,
        textureOffsetX: f32,
        textureOffsetY: f32,
        textureRotation: f32,
        canvasWidth: f32,
        canvasHeight: f32,
        pad0: f32,
        pad1: f32,
      }

      @group(0) @binding(0) var<uniform> matrices: Matrices;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
        @location(1) worldXZ: vec2f,
      }

      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(matrices.seed) +
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
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
      }

      // Elevation combination shared by vertex & fragment
      fn combinedElevation(x: f32, y: f32, z: f32) -> f32 {
        let layer1 = openSimplex3d(x * 0.005, y * 0.005, z);
        let layer3 = openSimplex3d(x * 0.05, y * 0.05, z);
        let layer5 = openSimplex3d(x * 0.02, y * 0.02, z);
        // Soften fine detail without extra layers: lower frequency + weight
        let layer6 = openSimplex3d(x * 0.2, y * 0.2, z);
        let oceanMask = layer1;
        // Reduce layer6 influence to soften bumpiness
        let baseHeight = layer3 * 0.35 + layer6 * 0.05;
        var lakeEffect = 0.0;
        if (oceanMask > 0.1) {
          lakeEffect = min(layer5 * 0.08, 0.0);
        }
        let rawHeight = oceanMask * 0.98 + baseHeight + lakeEffect - 0.35;
        return sign(rawHeight) * pow(abs(rawHeight), 0.85);
      }

      fn terrainHeightFromCombined(combined: f32) -> f32 {
        var height: f32;
        if (combined < 0.42) {
          // Water: deep oceans — slightly below sea level, gentle variation
          // t goes from 0 at deepest to 1 near the shallow threshold
          let t = combined / 0.42;
          height = mix(-0.0, -0.0, t);
        } else if (combined < 0.455) {
          // Water: shallow coastal — continues rising towards shoreline
          let t = (combined - 0.42) / 0.035;
          height = mix(-0.0, 0.1, t);
        } else if (combined < 0.465) {
          // Beach: gentle incline near shoreline
          let t = (combined - 0.455) / 0.01;
          height = mix(0.1, 0.3, t);
        } else if (combined < 0.55) {
          // Beach to lowlands: continued gentle rise
          let t = (combined - 0.465) / 0.085;
          height = mix(0.3, 1.8, t);
        } else if (combined < 0.58) {
          // Plains/lowlands: gradually rising terrain
          let t = (combined - 0.55) / 0.03;
          height = mix(1.8, 5.0, t);
        } else if (combined < 0.68) {
          // Hills/forest: more elevated rolling hills
          let t = (combined - 0.58) / 0.10;
          height = mix(5.0, 10.0, t);
        } else if (combined < 0.74) {
          // Mountains: steeper elevation increase
          let t = (combined - 0.68) / 0.06;
          height = mix(10.0, 16.0, t * t);
        } else {
          // Snow peaks: highest elevations
          let t = (combined - 0.74) / 0.26;
          height = mix(16.0, 24.0, t);
        }
        return height;
      }

      fn terrainHeightAtPlaneXZ(planeX: f32, planeZ: f32, zAnim: f32) -> f32 {
        // planeX/planeZ are already in scaled texture space
        let combined = combinedElevation(planeX, planeZ, zAnim);
        return terrainHeightFromCombined(combined);
      }

      fn applyTextureTransform(px: f32, pz: f32) -> vec2f {
        // Map mesh coordinates [-50,50] to pixel coordinates [0, canvasWidth/Height]
        // Use fixed scale (based on windowed canvas size) to keep texture scale consistent
        // Adjust by canvas size difference to keep texture centered
        let pixelX = (px + 50.0) * (500.0 / 100.0) + (matrices.canvasWidth - 500.0) / 2.0;
        let pixelZ = (pz + 50.0) * (500.0 / 100.0) + (matrices.canvasHeight - 500.0) / 2.0;
        
        // 2D-style center-based transform: match OpenSimplex2D/Mountains
        let texScale: f32 = 8.0;
        let offsetX = matrices.textureOffsetX / texScale;
        let offsetZ = matrices.textureOffsetY / texScale;
        let centerX = (matrices.canvasWidth * 0.5) / texScale * matrices.scale + offsetX;
        let centerZ = (matrices.canvasHeight * 0.5) / texScale * matrices.scale + offsetZ;
        let baseX = pixelX / texScale * matrices.scale + offsetX;
        let baseZ = pixelZ / texScale * matrices.scale + offsetZ;
        let relX = baseX - centerX;
        let relZ = baseZ - centerZ;
        let cosR = cos(matrices.textureRotation);
        let sinR = sin(matrices.textureRotation);
        let rotX = relX * cosR - relZ * sinR;
        let rotZ = relX * sinR + relZ * cosR;
        return vec2f(rotX + centerX, rotZ + centerZ);
      }

      @vertex fn vs(@location(0) pos: vec3f, @location(1) color: vec3f) -> VertexOutput {
        let texCoord = applyTextureTransform(pos.x, pos.z);
        let height = terrainHeightAtPlaneXZ(texCoord.x, texCoord.y, matrices.z);
        // Keep perceived height consistent across zoom levels
        let heightScaled = height / matrices.scale;
        let worldPos = vec4f(pos.x, heightScaled, pos.z, 1.0);
        let viewPos = matrices.view * worldPos;
        let clipPos = matrices.projection * viewPos;
        var output: VertexOutput;
        output.position = clipPos;
        output.worldPos = pos;
        output.worldXZ = vec2f(pos.x, pos.z);
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        // Apply texture rotation and offset
        let texCoord = applyTextureTransform(input.worldPos.x, input.worldPos.z);
        let x = texCoord.x;
        let y = texCoord.y;
        let z = matrices.z;
        
        // Simplified: reuse combinedElevation and trim biome smoothing
        let combined = combinedElevation(x, y, z);
        // Stronger biome effect: higher frequency + sharper transitions
        let biomeRaw = openSimplex3d(x * 0.04, y * 0.04, z);
        let biome = pow(biomeRaw, 0.7); // Sharpen transitions
        let earthType = openSimplex3d(x * 0.08, y * 0.08, z);
        let mountainHeightMod = openSimplex3d(x * 0.01, y * 0.01, z);
        
        // Determine terrain type based on elevation and biome
        var color: vec3f;
        if (combined < 0.42) {
          // Deep water
          let depth = combined / 0.42;
          color = mix(vec3f(0.02, 0.08, 0.20), vec3f(0.05, 0.15, 0.35), depth);
        } else if (combined < 0.455) {
          // Shallow water
          let t = (combined - 0.42) / 0.035;
          color = mix(vec3f(0.05, 0.15, 0.35), vec3f(0.12, 0.28, 0.48), t);
        } else if (combined < 0.465) {
          // Beach/sand
          let t = (combined - 0.455) / 0.01;
          let arcticSand = vec3f(0.70, 0.68, 0.60);
          let temperateSand = vec3f(0.76, 0.70, 0.50);
          let tropicalSand = vec3f(0.88, 0.85, 0.70);
          let desertSand = vec3f(0.82, 0.75, 0.55);
          
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
          // Lowlands/plains
          let t = (combined - 0.465) / 0.115;
          let arcticPlain = mix(vec3f(0.45, 0.50, 0.42), vec3f(0.38, 0.42, 0.35), t);
          let temperatePlain = mix(vec3f(0.52, 0.60, 0.35), vec3f(0.48, 0.55, 0.32), t);
          let tropicalPlain = mix(vec3f(0.35, 0.58, 0.28), vec3f(0.30, 0.52, 0.25), t);
          let desertPlain = mix(vec3f(0.72, 0.62, 0.42), vec3f(0.68, 0.58, 0.38), t);
          
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
          // Hills/forest
          let t = (combined - 0.58) / 0.10;
          let arcticForest = mix(vec3f(0.32, 0.38, 0.30), vec3f(0.28, 0.34, 0.26), t);
          let temperateForest = mix(vec3f(0.28, 0.45, 0.25), vec3f(0.24, 0.40, 0.22), t);
          let tropicalForest = mix(vec3f(0.15, 0.40, 0.18), vec3f(0.12, 0.32, 0.15), t);
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
          // Mountains/rock
          let mountainBase = 0.68;
          let mountainTop = 0.74 + mountainHeightMod * 0.12;
          var t = (combined - mountainBase) / (mountainTop - mountainBase);
          t = clamp(t, 0.0, 1.0);
          
          var mountainColor: vec3f;
          if (earthType < 0.33) {
            mountainColor = mix(vec3f(0.25, 0.23, 0.22), vec3f(0.40, 0.38, 0.36), t);
          } else if (earthType < 0.66) {
            mountainColor = mix(vec3f(0.42, 0.40, 0.38), vec3f(0.55, 0.52, 0.48), t);
          } else {
            mountainColor = mix(vec3f(0.58, 0.50, 0.38), vec3f(0.68, 0.58, 0.45), t);
          }
          
          if (biome < 0.3) {
            mountainColor = mix(mountainColor, vec3f(0.45, 0.47, 0.50), 0.2);
          } else if (biome > 0.7) {
            mountainColor = mix(mountainColor, vec3f(0.60, 0.48, 0.35), 0.15);
          }
          
          color = mountainColor;
        } else {
          // Snow/ice peaks
          let t = (combined - 0.74) / 0.26;
          color = mix(vec3f(0.88, 0.90, 0.92), vec3f(0.95, 0.97, 0.98), t);
        }
        // Lighting: compute per-fragment normal via height field finite differences
        let dx: f32 = 0.5;
        let dz: f32 = 0.5;
        let texCoord2 = applyTextureTransform(input.worldXZ.x, input.worldXZ.y);
        let worldX = texCoord2.x;
        let worldZ = texCoord2.y;
        let h = terrainHeightAtPlaneXZ(worldX, worldZ, z);
        let hx = terrainHeightAtPlaneXZ(worldX + dx, worldZ, z);
        let hz = terrainHeightAtPlaneXZ(worldX, worldZ + dz, z);
        let p = vec3f(worldX, h, worldZ);
        let px = vec3f(worldX + dx, hx, worldZ);
        let pz = vec3f(worldX, hz, worldZ + dz);
        let n = normalize(cross(pz - p, px - p));
        // Sun direction (fixed for now): slightly from above and one side
        let sunDir = normalize(vec3f(0.6, 0.8, 0.2));
        let ambient: f32 = 0.35;
        let diffuse = max(dot(n, sunDir), 0.0);
        let lighting = clamp(ambient + diffuse, 0.0, 1.2);
        let litColor = color * lighting;
        
        return vec4f(litColor, 1.0);
      }
    `,
  });

  // Create pipeline
  const pipeline = device.createRenderPipeline({
    label: "3d mountains pipeline",
    layout: "auto",
    vertex: {
      module,
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
      frontFace: "cw",
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  // Create bind group with pipeline's layout
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: matrixBuffer } }],
  });

  // Create depth texture
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  let lastTime = 0;

  const render = (time: DOMHighResTimeStamp) => {
    const deltaTime = lastTime ? time - lastTime : 0;
    lastTime = time;

    // Camera: use `controller3d` if provided, otherwise fall back to fixed camera
    let projMatrix: number[];
    let viewMatrix: number[];
    if (controller3d && controller3d.value) {
      const c = controller3d.value;
      const cam: CameraState = {
        position: c.position ?? [0, 80, 80],
        yaw: c.yaw ?? 0,
        pitch: c.pitch ?? -Math.PI / 4,
      };
      const fov = c.fov ?? Math.PI / 4;
      projMatrix = createPerspectiveMatrix(fov, options.width / options.height, 0.1, 1000);
      viewMatrix = createViewMatrix(cam);
    } else {
      const camera: CameraState = {
        position: [0, 80, 80],
        yaw: 0,
        pitch: -Math.PI / 4,
      };
      const fov = Math.PI / 4;
      projMatrix = createPerspectiveMatrix(fov, options.width / options.height, 0.1, 1000);
      viewMatrix = createViewMatrix(camera);
    }

    // Update uniform buffer with matrices and noise parameters
    const matrixData = new Float32Array(48); // 192 bytes / 4 bytes per float
    matrixData.set(projMatrix, 0);
    matrixData.set(viewMatrix, 16);
    matrixData[32] = 123456; // seed
    // Use the same zoom scale as other 2D renderers (no extra *2 multiplier)
    matrixData[33] = controller2d?.value?.zoom ?? 1.0; // scale (from 2D controller zoom)
    matrixData[34] = time * 0.0000; // z (animated)
    // Pass raw controller offsets (not divided by zoom or texScale)
    matrixData[35] = controller2d?.value?.x ?? 0;
    matrixData[36] = controller2d?.value?.y ?? 0;
    matrixData[37] = controller2d?.value?.rotation ?? 0; // textureRotation (from 2D controller)
    matrixData[38] = options.width;
    matrixData[39] = options.height;

    device.queue.writeBuffer(matrixBuffer, 0, matrixData);

    // Render
    const encoder = device.createCommandEncoder({ label: "3d encoder" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0.5, g: 0.7, b: 1.0, a: 1.0 },
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setVertexBuffer(1, colorBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");
    pass.drawIndexed(indexCount);
    pass.end();

    device.queue.submit([encoder.finish()]);
  };

  return {
    init: async () => {},
    update: async (time: DOMHighResTimeStamp) => {
      render(time);
    },
  };
}

function fail(msg: string) {
  throw new Error(msg);
}
