import { Camera, Coord, Dimensions } from "./interfaces";
import { clamp } from "./other";

export function getContext(
  canvas: HTMLCanvasElement | undefined,
  dimensions: {
    width: number;
    height: number;
  }
) {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d", {
    willReadFrequently: true,
  });
}

export function getDevicePixelRatio() {
  let ratio = 1;
  const screen = window.screen as any;

  // To account for zoom, change to use deviceXDPI instead of systemXDPI
  if (
    screen.systemXDPI !== undefined &&
    screen.logicalXDPI !== undefined &&
    screen.systemXDPI > screen.logicalXDPI
  ) {
    // Only allow for values > 1
    ratio = screen.systemXDPI / screen.logicalXDPI;
  } else if (window.devicePixelRatio !== undefined) {
    ratio = window.devicePixelRatio;
  }
  return ratio;
}

export function render(
  canvas: HTMLCanvasElement,
  dimensions: Dimensions,
  pixel: (coord: Coord) => number[],
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
  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const v = pixel({
        x: (x + cameraX) * cameraZoom,
        y: (y + cameraY) * cameraZoom,
      });
      const i = (x + y * width) * 4;
      data[i] = (v[0] * 0xff) >>> 0;
      data[i + 1] = (v[1] * 0xff) >>> 0;
      data[i + 2] = (v[2] * 0xff) >>> 0;
      data[i + 3] = ((v[3] ?? 1) * 0xff) >>> 0;
    }
  }

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
  } as Coord;
};
