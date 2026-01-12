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
        
        vertices.push(
          posX * scale,
          height,
          posZ * scale
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

  // Track person's position for WASD movement
  let personWorldX = 0;
  let personWorldZ = 0;
  let personRotation = 0; // radians
  const personSpeed = 0.1; // distance per frame when key is held
  const personRotationSpeed = 0.05; // radians per frame
  
  // Track key states directly
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
  
  // Function to generate stick figure geometry at a given position
  function generateStickFigure(posX: number, posZ: number, rotation: number = 0) {
    const vertices: number[] = [];
    const colors: number[] = []; // RGBA per vertex
    const indicesArray: number[] = [];
    
    const cos_rot = Math.cos(rotation);
    const sin_rot = Math.sin(rotation);
    
    // Helper to rotate a point around Y axis
    function rotateY(x: number, z: number): [number, number] {
      return [x * cos_rot - z * sin_rot, x * sin_rot + z * cos_rot];
    }
    
    // Helper to add a cuboid with color
    function addCuboid(
      minX: number, minY: number, minZ: number,
      maxX: number, maxY: number, maxZ: number,
      frontColor: [number, number, number],
      backColor: [number, number, number]
    ) {
      const startIdx = vertices.length / 3;
      
      // 8 vertices of the cuboid (in local space before rotation)
      const verts = [
        [minX, minY, minZ],
        [maxX, minY, minZ],
        [maxX, minY, maxZ],
        [minX, minY, maxZ],
        [minX, maxY, minZ],
        [maxX, maxY, minZ],
        [maxX, maxY, maxZ],
        [minX, maxY, maxZ],
      ];
      
      // Rotate and translate vertices
      verts.forEach(v => {
        const [rx, rz] = rotateY(v[0], v[2]);
        vertices.push(posX + rx, v[1], posZ + rz);
      });
      
      // Bottom face (backColor)
      indicesArray.push(startIdx + 0, startIdx + 1, startIdx + 2, startIdx + 0, startIdx + 2, startIdx + 3);
      colors.push(...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1);
      
      // Top face (backColor)
      indicesArray.push(startIdx + 4, startIdx + 6, startIdx + 5, startIdx + 4, startIdx + 7, startIdx + 6);
      colors.push(...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1);
      
      // Front face (+Z, frontColor)
      indicesArray.push(startIdx + 0, startIdx + 4, startIdx + 5, startIdx + 0, startIdx + 5, startIdx + 1);
      colors.push(...frontColor, 1, ...frontColor, 1, ...frontColor, 1, ...frontColor, 1, ...frontColor, 1, ...frontColor, 1);
      
      // Back face (-Z, backColor)
      indicesArray.push(startIdx + 2, startIdx + 6, startIdx + 7, startIdx + 2, startIdx + 7, startIdx + 3);
      colors.push(...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1);
      
      // Left face (backColor)
      indicesArray.push(startIdx + 0, startIdx + 3, startIdx + 7, startIdx + 0, startIdx + 7, startIdx + 4);
      colors.push(...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1);
      
      // Right face (backColor)
      indicesArray.push(startIdx + 1, startIdx + 5, startIdx + 6, startIdx + 1, startIdx + 6, startIdx + 2);
      colors.push(...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1, ...backColor, 1);
    }
    
    // Body cuboid: 0.4m wide, 1.7m tall, 0.3m deep
    const bodyW = 0.4;
    const bodyH = 1.7;
    const bodyD = 0.3;
    const bodyBaseY = 0;
    addCuboid(
      -bodyW/2, bodyBaseY, -bodyD/2,
      bodyW/2, bodyBaseY + bodyH, bodyD/2,
      [0.2, 0.8, 0.2],  // Green front
      [0.2, 0.2, 0.8]   // Blue back
    );
    
    // Left arm cuboid
    const armW = 0.1;
    const armH = 0.1;
    const armD = 0.4;
    const armY = bodyBaseY + bodyH * 0.6;
    addCuboid(
      -bodyW/2 - armD, armY - armH/2, -armW/2,
      -bodyW/2, armY + armH/2, armW/2,
      [0.2, 0.8, 0.2],  // Green front
      [0.2, 0.2, 0.8]   // Blue back
    );
    
    // Right arm cuboid
    addCuboid(
      bodyW/2, armY - armH/2, -armW/2,
      bodyW/2 + armD, armY + armH/2, armW/2,
      [0.2, 0.8, 0.2],  // Green front
      [0.2, 0.2, 0.8]   // Blue back
    );
    
    // Huge nose cuboid for direction indication: 0.2m (20cm) wide, 0.2m tall, 0.6m deep
    const noseW = 0.2;
    const noseH = 0.2;
    const noseD = 0.6;
    const noseCenterY = bodyBaseY + bodyH * 0.7;
    addCuboid(
      -noseW/2, noseCenterY - noseH/2, bodyD/2,
      noseW/2, noseCenterY + noseH/2, bodyD/2 + noseD,
      [1.0, 0.2, 0.2],  // Red front (direction indicator)
      [0.8, 0.0, 0.0]   // Dark red back
    );
    
    return { vertices, colors, indices: indicesArray };
  }

  // Create initial stick figure
  let stickFigureGeometry = generateStickFigure(personWorldX, personWorldZ);
  
  const stickFigureVertexBuffer = device.createBuffer({
    label: "stick figure vertex buffer",
    size: Math.max(stickFigureGeometry.vertices.length, 100) * 4, // allocate extra space
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(stickFigureVertexBuffer.getMappedRange()).set(stickFigureGeometry.vertices);
  stickFigureVertexBuffer.unmap();
  
  const stickFigureColorBuffer = device.createBuffer({
    label: "stick figure color buffer",
    size: Math.max(stickFigureGeometry.colors.length, 100) * 4, // allocate extra space
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(stickFigureColorBuffer.getMappedRange()).set(stickFigureGeometry.colors);
  stickFigureColorBuffer.unmap();
  
  const stickFigureIndexBuffer = device.createBuffer({
    label: "stick figure index buffer",
    size: Math.max(stickFigureGeometry.indices.length, 100) * 4, // allocate extra space
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint32Array(stickFigureIndexBuffer.getMappedRange()).set(stickFigureGeometry.indices);
  stickFigureIndexBuffer.unmap();
  
  let stickFigureIndexCount = stickFigureGeometry.indices.length;

  // Static view-projection matrix (no camera movement)
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

  // Create shader for stick figure (with colors)
  const stickFigureModule = device.createShaderModule({
    label: "stick figure shader",
    code: /* wgsl */ `
      @group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
        @location(0) position: vec3f,
        @location(1) color: vec4f
      ) -> VertexOutput {
        var output: VertexOutput;
        let clip = viewProj * vec4f(position, 1.0);
        output.position = clip;
        output.color = color;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        return input.color;
      }
    `,
  });

  const stickFigurePipeline = device.createRenderPipeline({
    label: "stick figure pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: stickFigureModule,
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
          arrayStride: 4 * 4,
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: "float32x4",
            },
          ],
        },
      ],
    },
    fragment: {
      module: stickFigureModule,
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "triangle-list",
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
      // Handle WASD movement relative to person's facing direction
      let moveForward = (keyStates['w'] ? 1 : 0) + (keyStates['s'] ? -1 : 0);
      let moveStrafe = (keyStates['d'] ? 1 : 0) + (keyStates['a'] ? -1 : 0);
      
      // Rotate movement by person's rotation
      const cos_rot = Math.cos(personRotation);
      const sin_rot = Math.sin(personRotation);
      const worldMoveX = moveStrafe * cos_rot - moveForward * sin_rot;
      const worldMoveZ = moveStrafe * sin_rot + moveForward * cos_rot;
      
      personWorldX += worldMoveX * personSpeed;
      personWorldZ += worldMoveZ * personSpeed;
      
      // Handle rotation with , and . keys (reversed)
      if (keyStates[',']) {
        personRotation -= personRotationSpeed;
      }
      if (keyStates['.']) {
        personRotation += personRotationSpeed;
      }
      
      // Clamp position to plane bounds (-5 to 5)
      personWorldX = Math.max(-4.5, Math.min(4.5, personWorldX));
      personWorldZ = Math.max(-4.5, Math.min(4.5, personWorldZ));
      
      // Update stick figure geometry
      stickFigureGeometry = generateStickFigure(personWorldX, personWorldZ, personRotation);
      stickFigureIndexCount = stickFigureGeometry.indices.length;
      
      // Update buffers
      device.queue.writeBuffer(stickFigureVertexBuffer, 0, new Float32Array(stickFigureGeometry.vertices));
      device.queue.writeBuffer(stickFigureColorBuffer, 0, new Float32Array(stickFigureGeometry.colors));
      device.queue.writeBuffer(stickFigureIndexBuffer, 0, new Uint32Array(stickFigureGeometry.indices));
      
      // Static camera view looking down at floor
      const eye: [number, number, number] = [0, -3, 8];
      const target: [number, number, number] = [0, 0, 0];
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
      
      // Draw stick figure
      pass.setPipeline(stickFigurePipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, stickFigureVertexBuffer);
      pass.setVertexBuffer(1, stickFigureColorBuffer);
      pass.setIndexBuffer(stickFigureIndexBuffer, "uint32");
      pass.drawIndexed(stickFigureIndexCount);
      
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
