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

  // Create uniform buffer for camera: x, z, rotation (16 bytes aligned)
  const uniformBuffer = device.createBuffer({
    label: "camera uniform",
    size: 16, // 4 floats: camX, camZ, rotation, padding
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
        z: f32,
        rotation: f32,
        padding: f32,
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
        
        // World space mesh position
        var worldPos = position;
        
        // Camera state
        let camHeight = 2.0; // 2m above ground
        let camX = camera.x;
        let camZ = camera.z;
        let camRot = camera.rotation;
        
        // Transform to camera space
        var viewPos = worldPos;
        viewPos.x -= camX;
        viewPos.y -= camHeight;
        viewPos.z -= camZ;
        
        // Rotate by camera heading (around Y axis)
        let cos_rot = cos(camRot);
        let sin_rot = sin(camRot);
        let rotX = viewPos.x * cos_rot + viewPos.z * sin_rot;
        let rotZ = -viewPos.x * sin_rot + viewPos.z * cos_rot;
        viewPos.x = rotX;
        viewPos.z = rotZ;
        
        // Perspective projection with 90 degree FOV
        var depth = viewPos.z;
        if (depth < 0.1) { depth = 0.1; }
        
        // FOV = 90 degrees means tan(45deg) = 1.0 as the focal length
        let fov = 1.0;
        let screenX = (viewPos.x / depth) * fov;
        let screenY = (viewPos.y / depth) * fov;
        let screenZ = clamp(depth / 100.0, 0.01, 0.99);
        
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
      // Update camera uniform (camX, camZ, rotation, padding)
      let moveStrafe = (data?.x ?? 0) * 0.01; // A/D
      let moveForward = (data?.y ?? 0) * 0.01; // W/S
      let rotation = data?.rotation ?? 0;
      
      // Simple: W moves forward along world -Z axis (toward negative Z)
      let camX = moveStrafe;
      let camZ = -moveForward;
      
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([camX, camZ, rotation, 0])
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
