export interface Geometry {
  vertexArray: Float32Array;
  indexArray: Uint32Array;
  vertexCount: number;
  vertexSize: number; // Byte size of one cube vertex.
  positionOffset: number;
  uvOffset: number;
  label: string;
}

export async function getDeviceContext(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  canvas.width = width;
  canvas.height = height;

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) return fail("need a browser that supports WebGPU");

  const context = canvas.getContext("webgpu")!;
  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
  });

  return { device, context };
}

export function createRenderer(
  device: GPUDevice,
  width: number,
  height: number
) {
  const depthTexture = device.createTexture({
    size: [width, height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
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
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };
  return {
    descriptor: renderPassDescriptor,
    encoder: null as GPUCommandEncoder | null,
    renderPass: null as GPURenderPassEncoder | null,
    computePass: null as GPUComputePassEncoder | null,
    start(context: GPUCanvasContext) {
      colorAttachment.view = context.getCurrentTexture().createView();
      this.encoder = device.createCommandEncoder({ label: "our encoder" });
    },
    getComputePass() {
      this.computePass = this.encoder!.beginComputePass(renderPassDescriptor);
      return this.computePass
    },
    getRenderPass() {
      this.renderPass = this.encoder!.beginRenderPass(renderPassDescriptor);
      return this.renderPass
    },
    end() {
      // if (this.renderPass) this.renderPass.end();
      // if (this.computePass) this.computePass.end();
      if (this.encoder) device.queue.submit([this.encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}

export function createLayout(geometry: Geometry) {
  const layout: GPUVertexBufferLayout = {
    arrayStride: geometry.vertexSize,
    attributes: [
      {
        // position
        shaderLocation: 0,
        offset: geometry.positionOffset,
        format: "float32x4",
      },
      {
        // uv
        shaderLocation: 1,
        offset: geometry.uvOffset,
        format: "float32x2",
      },
    ],
  };

  return layout;
}
