interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

function createPerspectiveMatrix(
  fov: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  const result = new Float32Array(16);
  result[0] = f / aspect;
  result[5] = f;
  result[10] = (far + near) * nf;
  result[11] = -1;
  result[14] = 2 * far * near * nf;

  return result;
}

function createViewMatrix(camera: CameraState): Float32Array {
  const [px, py, pz] = camera.position;
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const forwardX = sinYaw * cosPitch;
  const forwardY = sinPitch;
  const forwardZ = -cosYaw * cosPitch;

  const rightX = cosYaw;
  const rightY = 0;
  const rightZ = sinYaw;

  const upX = -sinYaw * sinPitch;
  const upY = cosPitch;
  const upZ = cosYaw * sinPitch;

  const result = new Float32Array(16);

  result[0] = rightX;
  result[1] = upX;
  result[2] = -forwardX;
  result[3] = 0;

  result[4] = rightY;
  result[5] = upY;
  result[6] = -forwardY;
  result[7] = 0;

  result[8] = rightZ;
  result[9] = upZ;
  result[10] = -forwardZ;
  result[11] = 0;

  result[12] = -(rightX * px + rightY * py + rightZ * pz);
  result[13] = -(upX * px + upY * py + upZ * pz);
  result[14] = forwardX * px + forwardY * py + forwardZ * pz;
  result[15] = 1;

  return result;
}

function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 4 + k] * b[k * 4 + col];
      }
      result[row * 4 + col] = sum;
    }
  }
  return result;
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
      // Add some height variation for depth perception
      const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
      positions.push(x, height, z);
      
      // Checkerboard color pattern with multiple shades of green
      const squareX = Math.floor((i / 2) % 2);
      const squareZ = Math.floor((j / 2) % 2);
      
      if (squareX === squareZ) {
        // Light green
        colors.push(0.4, 0.8, 0.4);
      } else {
        // Darker green
        colors.push(0.2, 0.5, 0.2);
      }
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

export async function setupMountains3DRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number }
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

  // Create uniform buffer for matrices
  const matrixBuffer = device.createBuffer({
    size: 128, // 2 matrices of 16 floats each
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Create shader module
  const module = device.createShaderModule({
    label: "3d mountains shader",
    code: /* wgsl */ `
      struct Matrices {
        projection: mat4x4f,
        view: mat4x4f,
      }

      @group(0) @binding(0) var<uniform> matrices: Matrices;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec3f,
      }

      @vertex fn vs(@location(0) pos: vec3f, @location(1) color: vec3f) -> VertexOutput {
        let worldPos = vec4f(pos, 1.0);
        let viewPos = matrices.view * worldPos;
        let clipPos = matrices.projection * viewPos;
        
        var output: VertexOutput;
        output.position = clipPos;
        output.color = color;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        return vec4f(input.color, 1.0);
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
    position: [30, 25, 40],
    yaw: -2.4,
    pitch: -0.6,
  };

  const keys: KeyState = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  const cameraSpeed = 0.05;
  const rotationSpeed = 0.02;

  // Keyboard event handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === "w") keys.w = true;
    if (key === "a") keys.a = true;
    if (key === "s") keys.s = true;
    if (key === "d") keys.d = true;
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === "w") keys.w = false;
    if (key === "a") keys.a = false;
    if (key === "s") keys.s = false;
    if (key === "d") keys.d = false;
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  let lastTime = 0;

  const updateCamera = (deltaTime: number) => {
    // Calculate forward and right vectors from yaw and pitch
    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);
    const cosPitch = Math.cos(camera.pitch);

    const forwardX = sinYaw * cosPitch;
    const forwardY = 0;
    const forwardZ = -cosYaw * cosPitch;

    const rightX = cosYaw;
    const rightZ = sinYaw;

    const moveSpeed = cameraSpeed * deltaTime;

    if (keys.w) {
      camera.position[0] += forwardX * moveSpeed;
      camera.position[2] += forwardZ * moveSpeed;
    }
    if (keys.s) {
      camera.position[0] -= forwardX * moveSpeed;
      camera.position[2] -= forwardZ * moveSpeed;
    }
    if (keys.a) {
      camera.position[0] -= rightX * moveSpeed;
      camera.position[2] -= rightZ * moveSpeed;
    }
    if (keys.d) {
      camera.position[0] += rightX * moveSpeed;
      camera.position[2] += rightZ * moveSpeed;
    }
  };

  // Add rotation handler for , and . keys
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === ",") camera.yaw -= rotationSpeed;
    if (e.key === ".") camera.yaw += rotationSpeed;
  });

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

    // Update uniform buffer
    const matrixData = new Float32Array(32);
    matrixData.set(projMatrix, 0);
    matrixData.set(viewMatrix, 16);
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

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  return {
    init: async () => {},
    update: async () => {},
  };
}

function fail(msg: string) {
  throw new Error(msg);
}
