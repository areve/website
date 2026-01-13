export async function setupMountains3DRenderer(
  canvas: HTMLCanvasElement,
  options: { width: number; height: number }
) {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) return fail("need a browser that supports WebGPU");

  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  const module = device.createShaderModule({
    label: "green fill shader",
    code: /* wgsl */ `
      @vertex fn vs(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4f {
        // Fullscreen triangle covering the canvas
        let pos = array<vec2f, 3>(
          vec2f(-1.0, -3.0),
          vec2f(3.0, 1.0),
          vec2f(-1.0, 1.0)
        );
        return vec4f(pos[vid], 0.0, 1.0);
      }

      @fragment fn fs() -> @location(0) vec4f {
        // Solid green fill
        return vec4f(0.0, 1.0, 0.0, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "green fill pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });

  const render = () => {
    const encoder = device.createCommandEncoder({ label: "green fill encoder" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();

    device.queue.submit([encoder.finish()]);
  };

  // Initial draw
  render();

  return { init: async () => {}, update: async () => render() };
}

function fail(msg: string) {
  throw new Error(msg);
}
