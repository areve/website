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
