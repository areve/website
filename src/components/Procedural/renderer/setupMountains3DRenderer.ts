export async function setupMountains3DRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const gridWidth = 4;
  const gridHeight = 4;

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
      const addVertex = (posX: number, posY: number, triId: number) => {
        const tiltAmount = 0.5;
        const tiltedY = posY - (posY * tiltAmount * 0.3);
        const perspective = 1.0 + (posY * -0.5 * tiltAmount);
        
        vertices.push(
          posX * perspective,
          tiltedY,
          posY * 0.2  // Slightly reduced z
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

  const module = device.createShaderModule({
    label: "mountains3d shader",
    code: /* wgsl */ `
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
        
        // Apply 3D perspective projection
        let z = position.z;
        let perspective = 1.0 / (1.0 + z * 0.5);
        
        // Project to screen with perspective
        let projectedX = position.x * perspective;
        let projectedY = position.y * perspective - z * 0.3;
        
        // Map z to NDC depth [0, 1] range - prevent near/far plane clipping
        let projectedZ = clamp((z + 0.5) / 1.5, 0.01, 0.99);
        
        output.position = vec4f(projectedX, projectedY, projectedZ, 1.0);
        output.position_ndc = vec3f(projectedX, projectedY, projectedZ);
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
    layout: "auto",
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
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "mountains3d encoder",
      });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
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
