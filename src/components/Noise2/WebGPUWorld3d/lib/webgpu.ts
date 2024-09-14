
export async function getDeviceContext(
  canvas: HTMLCanvasElement,
  width: number,
  height: number) {
  canvas.width = width;
  canvas.height = height;

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await (adapter?.requestDevice())!;
  if (!device) return fail("need a browser that supports WebGPU");

  const context = canvas.getContext("webgpu")!;
  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
  });

  return { device, context };
}
