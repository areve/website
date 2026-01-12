export async function setupMandelbrotRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 8,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotation: 0,
    asBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
        this.rotation,
      ]);
    },
  };

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

  const module = device.createShaderModule({
    label: "our hardcoded red color shader",
    code: /* wgsl */ `
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      // x and y are passed as coordinates relative to the view center (rotX/rotY)
      // Map these relative world coordinates into the complex plane using a
      // smaller world-to-complex factor so the initial view matches Mountains
      // more closely. The offsets center the fractal appropriately.
      fn mandelbrot(x: f32, y: f32) -> f32 {
        let worldToComplex: f32 = 0.06; 
        let r0: f32 = x * worldToComplex - 2.5;
        // Adjusted vertical offset slightly so the set is better centered on load.
        // For the current canvas/scale this maps the imaginary range to
        // approximately [-1.875, 1.875], which centers the fractal vertically.
        let i0: f32 = y * worldToComplex - 1.875;
        let maxIterations: i32 = 500;

        var r: f32 = 0.0;
        var i: f32 = 0.0;
        var iteration: i32 = 0;

        while (r * r + i * i <= 4.0 && iteration < maxIterations) {
          let rTemp: f32 = r * r - i * i + r0;
          i = 2.0 * r * i + i0;
          r = rTemp;
          iteration = iteration + 1;
        }

        return f32(iteration) / f32(maxIterations);
      }
          
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0) 
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let color = abs((data.z - floor(data.z)) * 2 - 1.0);
        
          // Calculate center and base world coords (match Mountains transform)
          let centerScreenX = data.width / 2.0;
          let centerScreenY = data.height / 2.0;
          let scale = data.scale;
          // Screen -> base world coordinates (apply scale and zoom, plus offsets)
          let baseX = coord.x / scale * data.zoom + data.x / scale;
          let baseY = coord.y / scale * data.zoom + data.y / scale;
          let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
          let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;

          // Relative to center in world units
          let relX = baseX - centerWorldX;
          let relY = baseY - centerWorldY;

          // Apply rotation in world space
          let cos_r = cos(data.rotation);
          let sin_r = sin(data.rotation);
          let rotX = relX * cos_r - relY * sin_r;
          let rotY = relX * sin_r + relY * cos_r;

          // Reconstruct world coordinates after rotation so panning/offsets apply
          // (rotX/rotY are relative to center; adding centerWorld restores absolute)
          let worldX = rotX + centerWorldX;
          let worldY = rotY + centerWorldY;

          // Call mandelbrot with absolute world coords so controller panning works
          let n = mandelbrot(worldX, worldY);
        return vec4<f32>(pow(n, 0.1) , pow(n, 0.2), color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red line pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const dataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.00001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "our encoder" });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
