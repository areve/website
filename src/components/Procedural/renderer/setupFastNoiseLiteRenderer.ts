export async function setupFastNoiseLiteRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number; seed?: number; scale?: number }
) {
  const sharedData = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 1337,
    scale: options.scale ?? 8,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotation: 0,
    // mode: 0 = OpenSimplex2, 1 = OpenSimplex2S, 2 = Value
    mode: 0,
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
        this.mode,
      ]);
    },
  };

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const canvasAny = canvas as any;

  let device: GPUDevice;
  let presentationFormat: GPUTextureFormat;

  if (canvasAny.__wgpu_device) {
    // Reuse previously-created device/format stored on the canvas to avoid
    // creating multiple devices which leads to TextureView <-> Device mismatches
    device = canvasAny.__wgpu_device as GPUDevice;
    presentationFormat = canvasAny.__wgpu_format as GPUTextureFormat;
  } else {
    const adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice()!;
    if (!device) return fail("need a browser that supports WebGPU");
    presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: presentationFormat });
    canvasAny.__wgpu_device = device;
    canvasAny.__wgpu_format = presentationFormat;
  }

  const shaderCode = await (await fetch(new URL("./fastnoiselite.wgsl", import.meta.url))).text();
  const module = device.createShaderModule({
    label: "fastnoiselite shader",
    code: shaderCode,
  });
  

  const pipeline = device.createRenderPipeline({
    label: "fastnoiselite pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: { module, entryPoint: "fs", targets: [{ format: presentationFormat }] },
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
    label: "fastnoiselite renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    async init() {},
    async update(time: DOMHighResTimeStamp, data?: { x?: number; y?: number; mode?: number }) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({ label: "fastnoiselite encoder" });
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

function fail(msg: string) { throw new Error(msg); }
