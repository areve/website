import { Rgb } from "../lib/color";
import { Camera, Dimensions } from "../lib/render";
import { RenderModel } from "./WorldRender";

export class MultiThreadedRender {}

const channels = 4;
export abstract class RenderThread {
  constructor() {
    this.init();
  }

  abstract pixel(x: number, y: number): Rgb;
  abstract update(model: RenderModel): void;

  private init() {
    self.onmessage = (
      event: MessageEvent<{
        origin: { x: number; y: number };
        dimensions: Dimensions;
        model: RenderModel;
        buffer: ArrayBuffer;
      }>
    ) => {
      const { model, origin, dimensions } = event.data;
      this.update(model);

      const buffer = this.render(
        origin.x,
        origin.y,
        dimensions.width,
        dimensions.height,
        model.camera,
        model.dimensions
      );

      self.postMessage(
        {
          buffer,
        },
        undefined as any,
        [buffer]
      );
    };
  }
  render(
    x: number,
    y: number,
    width: number,
    height: number,
    camera: Camera,
    dimensions: Dimensions
  ): ArrayBuffer {
    // console.log(self.onmessage)
    const cameraX = (camera?.x ?? 0) + x;
    const cameraY = (camera?.y ?? 0) + y;
    const cameraZoom = camera?.zoom ?? 1;
    const viewportCenterX = dimensions.width / 2;
    const viewportCenterY = dimensions.height / 2;
    const viewportAndCameraX = viewportCenterX + cameraX;
    const viewportAndCameraY = viewportCenterY + cameraY;

    // TODO later we'll try again with not creating a new buffer
    const data = new Uint8ClampedArray(width * height * channels);
    for (let ix = 0; ix < width; ++ix) {
      for (let iy = 0; iy < height; ++iy) {
        const v = this.pixel(
          (ix - viewportCenterX) * cameraZoom + viewportAndCameraX,
          (iy - viewportCenterY) * cameraZoom + viewportAndCameraY
        );
        const i = (ix + iy * width) * channels;
        data[i] = v[0] * 0xff;
        data[i + 1] = v[1] * 0xff;
        data[i + 2] = v[2] * 0xff;
        data[i + 3] = v[3] ? v[3] * 0xff : 0xff;
      }
    }
    return data.buffer;
  }
}
