import canvasColor from "./canvas-color";
import CanvasWriter from "./canvas-writer";

export default class ImageBufferManipulate extends CanvasWriter {
  constructor(canvas: HTMLCanvasElement, fps = 25, hiRes = true) {
    super(canvas, fps, hiRes);
  }

  clear(color: number) {
    const size = this.width * this.height;
    for (let i = 0; i < size; i++) {
      this.uint32[i] = color;
    }
    this.canvasUpdateIsRequired = true;
  }

  getPoint(x: number, y: number) {
    return this.uint32[~~y * this.width + ~~x];
  }

  setPoint(x: number, y: number, color: number) {
    this.uint32[~~y * this.width + ~~x] = color;
    this.canvasUpdateIsRequired = true;
  }

  subtractPoint(x: number, y: number, color: number) {
    const c1 = canvasColor.toRGB(this.getPoint(x, y));
    const c2 = canvasColor.toRGB(color);
    this.uint32[~~y * this.width + ~~x] = canvasColor.fromRGB(
      Math.max(c1.r - c2.r, 0),
      Math.max(c1.g - c2.g, 0),
      Math.max(c1.b - c2.b, 0)
    );
    this.canvasUpdateIsRequired = true;
  }
}
