import { Coord } from "@/components/World/lib/interfaces";
import { WorldRenderModel } from "./WorldRender";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { Dimensions } from "../lib/render";

console.log("WorldRenderThreadWorker");

let worldRenderModel: WorldRenderModel;
let world: WorldGenerator;

self.onmessage = (
  event: MessageEvent<{
    origin: Coord;
    dimensions: Dimensions;
    model: WorldRenderModel;
    buffer: ArrayBuffer;
  }>
) => {
  if (!world || event.data.model.seed !== worldRenderModel?.seed)
    world = makeWorldGenerator(event.data.model.seed);
  worldRenderModel = event.data.model;

  const origin = event.data.origin;
  const width = event.data.dimensions.width;
  const height = event.data.dimensions.height;

  const frame = worldRenderModel.frame;
  const cameraX = (worldRenderModel.camera?.x ?? 0) + origin.x;
  const cameraY = (worldRenderModel.camera?.y ?? 0) + origin.y;
  const cameraZoom = worldRenderModel.camera?.zoom ?? 1;
  const viewportCenterX = worldRenderModel.dimensions.width / 2;
  const viewportCenterY = worldRenderModel.dimensions.height / 2;
  const viewportAndCameraX = viewportCenterX + cameraX;
  const viewportAndCameraY = viewportCenterY + cameraY;

  const buffer = event.data.buffer;
  console.log("ok", buffer);

  const data = new Uint8ClampedArray(event.data.buffer);
  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const v = pixel(
        world(
          (x - viewportCenterX) * cameraZoom + viewportAndCameraX,
          (y - viewportCenterY) * cameraZoom + viewportAndCameraY,
          frame
        )
      );
      const i = (x + y * width) * 4;
      data[i] = v[0] * 0xff;
      data[i + 1] = v[1] * 0xff;
      data[i + 2] = v[2] * 0xff;
      data[i + 3] = v[3] ? v[3] * 0xff : 0xff;
    }
  }

  self.postMessage(
    {
      buffer,
    },
    [buffer] as any // "any" here because the types are wrong, transferable is supported
  );
};
