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

  // Generate grid vertices
  const vertices: number[] = [];
  for (let y = 0; y <= gridHeight; y++) {
    for (let x = 0; x <= gridWidth; x++) {
      vertices.push(
        (x / gridWidth) * 2 - 1,  // x: -1 to 1
        (y / gridHeight) * 2 - 1, // y: -1 to 1
        0                          // z: 0
      );
    }
  }

  // Generate triangle indices for wireframe grid
  const indices: number[] = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const a = y * (gridWidth + 1) + x;
      const b = a + 1;
      const c = a + (gridWidth + 1);
      const d = c + 1;

      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const vertexBuffer = device.createBuffer({
    label: "grid vertex buffer",
    size: vertices.length * 4,
    mappedAtCreation: true,
    usage: GPUBufferUsage.VERTEX,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

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
      };

      @vertex fn vs(
        @location(0) position: vec3f
      ) -> VertexOutput {
        var output: VertexOutput;
        output.position = vec4f(position, 1.0);
        output.position_ndc = position;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        let pos = input.position_ndc;
        
        // Checkerboard pattern
        let checkSize = 0.1;
        let checkX = i32(floor(pos.x / checkSize));
        let checkY = i32(floor(pos.y / checkSize));
        let isEven = (checkX + checkY) % 2 == 0;
        
        var color = vec3f(0.2);
        if (isEven) {
          color = vec3f(0.8);
        }
        
        // Edge detection for polygon outlines
        let dx = fwidth(pos.x);
        let dy = fwidth(pos.y);
        let edgeX = smoothstep(0.0, 2.0 * dx, fract(pos.x / checkSize) - 0.5);
        let edgeY = smoothstep(0.0, 2.0 * dy, fract(pos.y / checkSize) - 0.5);
        let edge = min(edgeX, edgeY);
        
        color = mix(vec3f(0.0), color, edge);
        
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
