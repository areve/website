export interface Geometry {
  vertexArray: Float32Array;
  indexArray: Uint32Array;
  vertexCount: number;
  label: string;
  layout?: Iterable<GPUVertexBufferLayout | null>
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
    setup(context: GPUCanvasContext) {
      colorAttachment.view = context.getCurrentTexture().createView();
    },
    getRenderPass(encoder: GPUCommandEncoder) {
      return encoder.beginRenderPass(renderPassDescriptor);
    },
    end(encoder: GPUCommandEncoder) {
      device.queue.submit([encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
