export async function setupMountains3DRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const gridWidth = 50;
  const gridHeight = 50;

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

  // Generate grid vertices with perspective tilt
  const vertices: number[] = [];
  const vertexTriangleIds: number[] = [];
  
  // Generate triangle indices for wireframe grid
  const indices: number[] = [];
  let triangleCounter = 0;
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const posX0 = (x / gridWidth) * 2 - 1;
      const posX1 = ((x + 1) / gridWidth) * 2 - 1;
      const posY0 = (y / gridHeight) * 2 - 1;
      const posY1 = ((y + 1) / gridHeight) * 2 - 1;

      // Helper to add vertex
      const addVertex = (posX: number, posZ: number, triId: number) => {
        // Simple flat floor at y=0, varying height with noise-like pattern
        const height = 0.0; // Floor is flat (y=0)
        const scale = 5.0; // 10m x 10m square (ranges from -5 to +5)
        const panelOffset = -5.0; // Offset panel so far edge is at person's feet
        
        vertices.push(
          posX * scale,
          height,
          posZ * scale + panelOffset
        );
        vertexTriangleIds.push(triId);
        return vertices.length / 3 - 1;
      };

      // First triangle: top-left, top-right, bottom-left
      const a0 = addVertex(posX0, posY0, triangleCounter);
      const b0 = addVertex(posX1, posY0, triangleCounter);
      const c0 = addVertex(posX0, posY1, triangleCounter);
      indices.push(a0, b0, c0);
      triangleCounter++;

      // Second triangle: top-right, bottom-right, bottom-left
      const b1 = addVertex(posX1, posY0, triangleCounter);
      const d1 = addVertex(posX1, posY1, triangleCounter);
      const c1 = addVertex(posX0, posY1, triangleCounter);
      indices.push(b1, d1, c1);
      triangleCounter++;
    }
  }

  // Create triangle IDs from vertex assignments
  const triangleIds: Uint32Array = new Uint32Array(vertexTriangleIds);

  const vertexBuffer = device.createBuffer({
    label: "grid vertex buffer",
    size: vertices.length * 4,
    mappedAtCreation: true,
    usage: GPUBufferUsage.VERTEX,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  const triangleIdBuffer = device.createBuffer({
    label: "triangle id buffer",
    size: triangleIds.byteLength,
    mappedAtCreation: true,
    usage: GPUBufferUsage.VERTEX,
  });
  new Uint32Array(triangleIdBuffer.getMappedRange()).set(triangleIds);
  triangleIdBuffer.unmap();

  const indexBuffer = device.createBuffer({
    label: "grid index buffer",
    size: indices.length * 4,
    mappedAtCreation: true,
    usage: GPUBufferUsage.INDEX,
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(indices);
  indexBuffer.unmap();

  // First-person camera state
  let cameraX = 0;
  let cameraZ = 0;
  let cameraY = 1.7; // eye height
  let cameraRotation = 0; // radians, 0 = looking toward -Z
  const moveSpeed = 0.1;
  const rotateSpeed = 0.05;

  // Track key states
  const keyStates: { [key: string]: boolean } = {};
  
  function handleKeyDown(e: KeyboardEvent) {
    keyStates[e.key.toLowerCase()] = true;
  }
  
  function handleKeyUp(e: KeyboardEvent) {
    keyStates[e.key.toLowerCase()] = false;
  }
  
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  // View-projection matrix buffer
  const uniformBuffer = device.createBuffer({
    label: "camera uniform",
    size: 64, // 4x4 matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {},
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const module = device.createShaderModule({
    label: "mountains3d shader",
    code: /* wgsl */ `
      @group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) position_ndc: vec3f,
        @location(1) @interpolate(flat) triangle_id: u32,
      };

      @vertex fn vs(
        @location(0) position: vec3f,
        @location(1) triangle_id: u32
      ) -> VertexOutput {
        var output: VertexOutput;
        
        // World space mesh position
        let worldPos = position;
        
        // Transform to clip space using view-projection matrix
        let clip = viewProj * vec4f(worldPos, 1.0);
        output.position = clip;
        output.position_ndc = clip.xyz / clip.w;
        output.triangle_id = triangle_id;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        let triId = input.triangle_id;
        
        // Generate solid color per triangle using hash
        let hash = (triId * 73856093u) ^ ((triId * 19349663u) >> 1u);
        let r = f32((hash >> 0u) & 255u) / 255.0;
        let g = f32((hash >> 8u) & 255u) / 255.0;
        let b = f32((hash >> 16u) & 255u) / 255.0;
        let color = vec3f(r, g, b);
        
        return vec4f(color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "mountains3d pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module,
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            },
          ],
        },
        {
          arrayStride: 4,
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: "uint32",
            },
          ],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.1, 0.1, 0.1, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "mountains3d renderPass",
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
      // Handle rotation with , and . keys
      if (keyStates[',']) {
        cameraRotation -= rotateSpeed;
      }
      if (keyStates['.']) {
        cameraRotation += rotateSpeed;
      }

      // Handle WASD movement relative to camera's facing direction
      const forward = (keyStates['w'] ? 1 : 0) + (keyStates['s'] ? -1 : 0);
      const strafe = (keyStates['a'] ? -1 : 0) + (keyStates['d'] ? 1 : 0);

      // Forward direction: camera looks toward -Z when rotation=0
      const forwardX = -Math.sin(cameraRotation);
      const forwardZ = -Math.cos(cameraRotation);
      // Right direction (perpendicular to forward)
      const rightX = Math.cos(cameraRotation);
      const rightZ = -Math.sin(cameraRotation);

      cameraX += (forwardX * forward + rightX * strafe) * moveSpeed;
      cameraZ += (forwardZ * forward + rightZ * strafe) * moveSpeed;

      // Camera eye position
      const eye: [number, number, number] = [cameraX, cameraY, cameraZ];
      // Target is 1 unit forward from eye
      const target: [number, number, number] = [
        cameraX + forwardX,
        cameraY,
        cameraZ + forwardZ
      ];
      const up: [number, number, number] = [0, 1, 0];
      
      const view = makeLookAtMatrix(eye, target, up);
      const aspect = options.width / options.height;
      const projection = makePerspectiveMatrix(Math.PI / 2, aspect, 0.1, 200);
      const viewProj = multiplyMat4(projection, view);
      
      device.queue.writeBuffer(uniformBuffer, 0, viewProj);

      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "mountains3d encoder",
      });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      
      // Draw floor mesh
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, vertexBuffer);
      pass.setVertexBuffer(1, triangleIdBuffer);
      pass.setIndexBuffer(indexBuffer, "uint32");
      pass.drawIndexed(indices.length);
      
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}

function fail(msg: string) {
  throw new Error(msg);
}

function makePerspectiveMatrix(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function normalizeVec3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function makeLookAtMatrix(eye: [number, number, number], target: [number, number, number], up: [number, number, number]): Float32Array {
  const zAxis = normalizeVec3([
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  ]);
  const xAxis = normalizeVec3(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);

  const out = new Float32Array(16);
  out[0] = xAxis[0];
  out[1] = xAxis[1];
  out[2] = xAxis[2];
  out[3] = 0;
  out[4] = yAxis[0];
  out[5] = yAxis[1];
  out[6] = yAxis[2];
  out[7] = 0;
  out[8] = zAxis[0];
  out[9] = zAxis[1];
  out[10] = zAxis[2];
  out[11] = 0;
  out[12] = -dot(xAxis, eye);
  out[13] = -dot(yAxis, eye);
  out[14] = -dot(zAxis, eye);
  out[15] = 1;
  return out;
}

function multiplyMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}
