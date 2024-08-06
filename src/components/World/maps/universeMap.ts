export function makeUniverseMap(weightMap: number[]) {
  return weightMap;
}

const width = 256;
const height = 256;

export function renderUniverse(
  context: CanvasRenderingContext2D | null,
  data: number[]
) {
  if (!context) return;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  const imageData = new ImageData(width, height);
  const pixelData = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = (y * width + x) * 4;
      pixelData[o + 0] = ((data[i] / 0xffffffff) * 255) & 0xff;
      pixelData[o + 1] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 8) & 0xff;
      pixelData[o + 2] = ((data[i] / 0xffffffff) * 255) & 0xff; //(data[i] >> 16) & 0xff;

      pixelData[o + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
}