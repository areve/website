import { makeWorldGenerator } from "./world";

export { render };

export let buffer: Uint8ClampedArray = new Uint8ClampedArray(0);

const generator = makeWorldGenerator(12345);

function render(width: i32, height: i32): void {
  const channels: i8 = 4;
  const size: i32 = width * height * channels;
  if (size !== buffer.length) buffer = new Uint8ClampedArray(size);
  for (let x: i32 = 0; x < width; ++x) {
    for (let y: i32 = 0; y < height; ++y) {
      const i: i32 = (y * width + x) * 4;
      buffer[i] = generator(x, y, 0);
      buffer[i + 1] = generator(x, y, 0);
      buffer[i + 2] = generator(x, y, 0);
      buffer[i + 3] = 255;
    }
  }
}
