import noiseWgsl from "./Flowfield2/noise.wgsl?raw";
import commonWgsl from "./Flowfield2/common.wgsl?raw";
import backgroundWgsl from "./Flowfield2/background.wgsl?raw";
import openSimplexWgsl from "./Flowfield2/openSimplex3d.wgsl?raw";
import { setupSharedResources } from "./Flowfield2/shared";
import { setupWebGpu } from "./Flowfield2/webgpu";
import { setupBackgroundResources } from "./Flowfield2/background";

export async function setupFlowfield2Renderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  canvas.width = options.width;
  canvas.height = options.height;

  const webGpu = await setupWebGpu(canvas);
  const { device, context, presentationFormat } = webGpu;
  const { dataBuffer, sharedData } = setupSharedResources(device, options);

  const shaderCode =
    `${commonWgsl}\n` +
    `${noiseWgsl}\n` +
    `${openSimplexWgsl}\n ` +
    `${backgroundWgsl}`;

  const background = setupBackgroundResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer
  );

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
      sharedData.z = time * 0.0;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      background.colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "flowfield2 encoder",
      });
      const pass = encoder.beginRenderPass(background.renderPassDescriptor);
      pass.setPipeline(background.pipeline);
      pass.setBindGroup(0, background.bindGroup);
      pass.draw(6);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
