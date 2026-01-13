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
  const seed = 12345;
  const scale = 0.1;
  const maxHeight = 20;

  // Helper functions for OpenSimplex noise
  function noise(x: number, y: number, z: number, w: number): number {
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    const sz = Math.floor(z);
    const sw = Math.floor(w);
    
    const n = bitcastToU32(seed) +
      bitcastToU32(x * 374761393.0) +
      bitcastToU32(y * 668265263.0) +
      bitcastToU32(z * 1440662683.0) +
      bitcastToU32(w * 3865785317.0);
    const m = (n ^ (n >> 13)) * 1274126177;
    return m / 0xffffffff;
  }

  function bitcastToU32(f: number): number {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = f;
    return new Uint32Array(buf)[0];
  }

  function vertexContribution(
    ix: number, iy: number, iz: number,
    fx: number, fy: number, fz: number,
    cx: number, cy: number, cz: number
  ): number {
    const unskew3d = 1.0 / 6.0;
    const rSquared3d = 3.0 / 4.0;

    const dx = fx - cx;
    const dy = fy - cy;
    const dz = fz - cz;
    const skewedOffset = (dx + dy + dz) * unskew3d;
    const dxs = dx - skewedOffset;
    const dys = dy - skewedOffset;
    const dzs = dz - skewedOffset;

    const a = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
    if (a < 0.0) {
      return 0.0;
    }

    const h = Math.floor(noise(ix + cx, iy + cy, iz + cz, 0.0) * 0xfff) & 0xfff;
    const u = (h & 0xf) - 8;
    const v = ((h >> 4) & 0xf) - 8;
    const w = ((h >> 8) & 0xf) - 8;
    return (a * a * a * a * (u * dxs + v * dys + w * dzs)) / 2.0;
  }

  function openSimplex3d(x: number, y: number, z: number): number {
    const skew3d = 1.0 / 3.0;
    const unskew3d = 1.0 / 6.0;

    const sx = x;
    const sy = y;
    const sz = z;
    const skew = (sx + sy + sz) * skew3d;
    const ix = Math.floor(sx + skew);
    const iy = Math.floor(sy + skew);
    const iz = Math.floor(sz + skew);
    const fx = sx + skew - ix;
    const fy = sy + skew - iy;
    const fz = sz + skew - iz;

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

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = -half + i * step;
      const z = -half + j * step;
      
      // Calculate noise-based height
      const noiseX = x * scale;
      const noiseZ = z * scale;
      const noiseVal = openSimplex3d(noiseX, noiseZ, 0);
      const height = noiseVal * maxHeight;
      
      positions.push(x, height, z);
      
      // Colors based on noise value (white to black)
      colors.push(noiseVal, noiseVal, noiseVal);
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
  controller?: any
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
  const geometry = createPlaneGeometry(100, 100);
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
    size: 144, // 2 matrices (16 floats each) + 3 floats (seed, scale, z)
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
      }

      @group(0) @binding(0) var<uniform> matrices: Matrices;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
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

      @vertex fn vs(@location(0) pos: vec3f, @location(1) color: vec3f) -> VertexOutput {
        let x = pos.x * matrices.scale;
        let y = pos.z * matrices.scale;
        let z = matrices.z;
        
        let noiseVal = openSimplex3d(x, y, z);
        let height = noiseVal * 20.0;
        
        let worldPos = vec4f(pos.x, height, pos.z, 1.0);
        let viewPos = matrices.view * worldPos;
        let clipPos = matrices.projection * viewPos;
        
        var output: VertexOutput;
        output.position = clipPos;
        output.worldPos = pos;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        let x = input.worldPos.x * matrices.scale;
        let y = input.worldPos.z * matrices.scale;
        let z = matrices.z;
        
        let noiseVal = openSimplex3d(x, y, z);
        return vec4f(noiseVal, noiseVal, noiseVal, 1.0);
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
      cullMode: "none",
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

  // Camera state
  const camera: CameraState = {
    position: [0, 25, 40],
    yaw: 0,
    pitch: -0.6,
  };

  const cameraSpeed = 0.05;

  const updateCamera = (deltaTime: number) => {
    // Get input from 3D controller
    const movement = controller?.value?.movement || { forward: 0, backward: 0, left: 0, right: 0 };
    const rotationSpeed = controller?.value?.rotation || 0;

    // Apply rotation
    camera.yaw += rotationSpeed;

    // Calculate forward and right vectors from yaw and pitch
    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);
    const cosPitch = Math.cos(camera.pitch);

    const forwardX = sinYaw * cosPitch;
    const forwardZ = -cosYaw * cosPitch;

    const rightX = cosYaw;
    const rightZ = sinYaw;

    const speed = cameraSpeed * deltaTime;

    // Apply movement
    if (movement.forward) {
      camera.position[0] += forwardX * speed;
      camera.position[2] += forwardZ * speed;
    }
    if (movement.backward) {
      camera.position[0] -= forwardX * speed;
      camera.position[2] -= forwardZ * speed;
    }
    if (movement.left) {
      camera.position[0] -= rightX * speed;
      camera.position[2] -= rightZ * speed;
    }
    if (movement.right) {
      camera.position[0] += rightX * speed;
      camera.position[2] += rightZ * speed;
    }
  };

  let lastTime = 0;

  const render = (time: DOMHighResTimeStamp) => {
    const deltaTime = lastTime ? time - lastTime : 0;
    lastTime = time;

    // Update camera
    updateCamera(deltaTime);

    // Create view and projection matrices
    const projMatrix = createPerspectiveMatrix(
      Math.PI / 4,
      options.width / options.height,
      0.1,
      1000
    );
    const viewMatrix = createViewMatrix(camera);

    // Update uniform buffer with matrices and noise parameters
    const matrixData = new Float32Array(36);
    matrixData.set(projMatrix, 0);
    matrixData.set(viewMatrix, 16);
    matrixData[32] = 12345; // seed
    matrixData[33] = 0.1; // scale
    matrixData[34] = time * 0.0005; // z (animated)
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
