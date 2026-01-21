export async function setupWebGpu(canvasEl: HTMLCanvasElement) {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) throw new Error("need a browser that supports WebGPU");
  const context = canvasEl.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: presentationFormat });
  return { device, context, presentationFormat };
}
