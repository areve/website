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
        const scale = 1.0; // Original size
        
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

  // Create uniform buffer for pan (x, y) and rotation
  const uniformBuffer = device.createBuffer({
    label: "camera uniform",
    size: 12, // 3 floats: x, y, rotation
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
      struct Camera {
        x: f32,
        y: f32,
        rotation: f32,
      }
      @group(0) @binding(0) var<uniform> camera: Camera;

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
        
        var pos = position;
        
        // Apply pan offset (scaled down for 3D view)
        pos.x += camera.x * 0.01;
        pos.z += camera.y * 0.01;
        
        // Rotate position around Z axis (camera orbits around mesh)
        let cos_r = cos(camera.rotation);
        let sin_r = sin(camera.rotation);
        let rotX = pos.x * cos_r - pos.z * sin_r;
        let rotZ = pos.x * sin_r + pos.z * cos_r;
        
        pos.x = rotX;
        pos.z = rotZ;
        
        // Camera position and orientation
        let tiltAngle = 0.5236; // 30 degrees in radians
        let cos_tilt = cos(tiltAngle);
        let sin_tilt = sin(tiltAngle);
        
        // Apply tilt transform to position relative to camera
        // Tilt around X axis: rotate Y and Z
        let tiltedY = pos.y * cos_tilt - pos.z * sin_tilt;
        let tiltedZ = pos.y * sin_tilt + pos.z * cos_tilt;
        
        // Perspective: objects further back appear smaller
        let camDistance = 5.0;
        let depth = camDistance - tiltedZ;
        var safedepth = depth;
        if (safedepth < 0.1) { safedepth = 0.1; }
        
        let perspective = 1.0 / safedepth;
        
        // Project to screen
        let screenX = pos.x * perspective * 4.0;
        let screenY = tiltedY * perspective * 4.0;
        let screenZ = clamp(safedepth / 10.0, 0.01, 0.99);
        
        output.position = vec4f(screenX, screenY, screenZ, 1.0);
        output.position_ndc = vec3f(screenX, screenY, screenZ);
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
      // Update camera uniform (x, y, rotation)
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([data?.x ?? 0, data?.y ?? 0, data?.rotation ?? 0])
      );

      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "mountains3d encoder",
      });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
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
