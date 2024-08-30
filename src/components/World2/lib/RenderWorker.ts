import { Rgb } from "./color";
import { Camera, Dimensions } from "./render";
import { makeWorld } from "../world/world";

const world = makeWorld(12345);

console.log("hello");

let busy = false;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;

self.onmessage = (event: MessageEvent<any>) => {
  if (event.data.canvas) {
    canvas = event.data.canvas;
    context = canvas.getContext("2d");
  }
  // if (event.data.frame) {
    // world.frame = event.data.frame;
  // }

  render(event.data.dimensions, world.pixel, event.data.camera);
};

function render(
  dimensions: Dimensions,
  pixel: (x: number, y: number) => Rgb,
  camera?: Camera
) {
  if (!context) return;
  if (busy) return;
  world.frame++;
  busy = true;
  const start = self.performance.now();
  console.log("render");

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
  context.putImageData(imageData, 0, 0);

  const end = self.performance.now();
  console.log("rendered", (end - start) | 0, "ms");

  setTimeout(() => {
    busy = false;
  }, 0);
}
