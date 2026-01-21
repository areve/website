import { setupSharedResources } from "./Flowfield2/shared";
import { setupWebGpu } from "./Flowfield2/webgpu";
import { renderBackgroundToTexture, setupBackgroundResources } from "./Flowfield2/background";
import { setupNormalsResources, renderNormalsToTexture } from "./Flowfield2/normals";
import {
  renderComposite,
  setupCompositeResources,
} from "./Flowfield2/composite";
import {
  renderParticleTexture,
  setupParticleResources,
  updateParticles,
} from "./Flowfield2/particle";
import { setupTrailsResources, renderTrails } from "./Flowfield2/trails";

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

  const { device, context, presentationFormat } = await setupWebGpu(canvas);
  const { dataBuffer, sharedData } = setupSharedResources(device, options);
  // Keep a copy of the previous-frame uniforms so we can reproject trails when
  // the camera (pan/zoom/rotation) changes.
  const prevDataBuffer = device.createBuffer({
    size: sharedData.asBuffer().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  // initialize prevDataBuffer to the same starting values
  device.queue.writeBuffer(prevDataBuffer, 0, sharedData.asBuffer());

  const background = setupBackgroundResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer
  );

  const normals = setupNormalsResources(
    device,
    presentationFormat,
    options.width,
    options.height,
    dataBuffer,
    background.texture,
    background.sampler
  );

  const particle = setupParticleResources(
    device,
    options.width,
    options.height,
    dataBuffer,
    sharedData
  );

  const trails = setupTrailsResources(device, options.width, options.height);
  const composite = setupCompositeResources(
    device,
    presentationFormat,
    dataBuffer,
    background,
    particle,
    { texture: trails.textures[trails.srcIndex] }
  );

  let lastFrameTime = performance.now();
  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      const now = performance.now();
      const deltaTime = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      // store current uniforms into prevDataBuffer so the trails fade shader can
      // reproject previous-frame trails into the current view
      device.queue.writeBuffer(prevDataBuffer, 0, sharedData.asBuffer());

      Object.assign(sharedData, data);
      sharedData.z = time * 0.0001;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());

      const encoder = device.createCommandEncoder();

      renderBackgroundToTexture(encoder, background);
      renderNormalsToTexture(encoder, normals);
      updateParticles(
        encoder,
        device,
        dataBuffer,
        particle,
        normals,
        deltaTime
      );
      renderParticleTexture(encoder, particle);
      // accumulate particle image into trails texture
      renderTrails(encoder, device, trails, particle.texture, dataBuffer, prevDataBuffer);
      // composite using the latest trails texture
      renderComposite(encoder, context, composite, device, trails.textures[trails.srcIndex]);

      device.queue.submit([encoder.finish()]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
