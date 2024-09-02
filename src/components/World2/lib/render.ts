import { Rgb } from "./color";
import { clamp } from "./clamp";
export interface Dimensions {
  width: number;
  height: number;
}
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
export function getContext(
  canvas: HTMLCanvasElement | OffscreenCanvas | undefined,
  dimensions: {
    width: number;
    height: number;
  }
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d") as any;
}

export function getDevicePixelRatio() {
  let ratio = 1;
  const screen = self.screen as any;

  // To account for zoom, change to use deviceXDPI instead of systemXDPI
  if (
    screen.systemXDPI !== undefined &&
    screen.logicalXDPI !== undefined &&
    screen.systemXDPI > screen.logicalXDPI
  ) {
    // Only allow for values > 1
    ratio = screen.systemXDPI / screen.logicalXDPI;
  } else if (self.devicePixelRatio !== undefined) {
    ratio = self.devicePixelRatio;
  }
  return ratio;
}

export function render(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  dimensions: Dimensions,
  pixel: (x: number, y: number) => Rgb,
  camera?: Camera
) {
  const context = getContext(canvas, dimensions);
  if (!context) return;

  const width = Math.ceil(dimensions.width);
  const height = Math.ceil(dimensions.height);

  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const cameraX = camera?.x ?? 0;
  const cameraY = camera?.y ?? 0;
  const cameraZoom = camera?.zoom ?? 1;
  const viewportCenterX = width / 2;
  const viewportCenterY = height / 2;
  const viewportAndCameraX = viewportCenterX + cameraX;
  const viewportAndCameraY = viewportCenterY + cameraY;
  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const v = pixel(
        (x - viewportCenterX) * cameraZoom + viewportAndCameraX,
        (y - viewportCenterY) * cameraZoom + viewportAndCameraY
      );
      const i = (x + y * width) * 4;
      data[i] = v[0] * 0xff;
      data[i + 1] = v[1] * 0xff;
      data[i + 2] = v[2] * 0xff;
      data[i + 3] = v[3] ? v[3] * 0xff : 0xff;
    }
  }

  const memory = new WebAssembly.Memory({
    initial: 80,
    maximum: 80,
    shared: true
  });
  const foo = new Uint8ClampedArray(width * height);

  foo.fill(127);

  imageData.data.set(foo);
  context.putImageData(imageData, 0, 0);
}

export const coordFromEvent = (
  event: MouseEvent,
  dimensions: {
    width: number;
    height: number;
  }
) => {
  return {
    x: Math.round(
      clamp(event.offsetX, 0, dimensions.width - 1) * getDevicePixelRatio()
    ),
    y: Math.round(
      clamp(event.offsetY, 0, dimensions.height - 1) * getDevicePixelRatio()
    ),
  };
};
