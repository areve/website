import { clamp } from "../lib/other";

export interface Dimensions {
  width: number;
  height: number;
}

export interface Coord {
  x: number;
  y: number;
}

function getContext(
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

export function render(
  canvas: HTMLCanvasElement,
  dimensions: Dimensions,
  pixel: (coord: Coord) => number[],
  camera?: { x: number; y: number }
) {
  const context = getContext(canvas, dimensions);
  if (!context) return;
  const width = dimensions.width;
  const height = dimensions.height;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const xMax = dimensions.width;
  const yMax = dimensions.height;
  const cameraX = camera?.x ?? 0;
  const cameraY = camera?.y ?? 0;
  for (let x = 0; x < xMax; ++x) {
    for (let y = 0; y < yMax; ++y) {
      const v = pixel({ x: x + cameraX, y: y + cameraY });
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
    x: Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    y: Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  } as Coord;
};
