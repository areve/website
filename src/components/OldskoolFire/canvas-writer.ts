import ImageBuffer from "./image-buffer";
import { Constantly, constantly } from "./constantly";
import { getDevicePixelRatio } from "./get-device-pixel-ratio";

export default class CanvasWriter extends ImageBuffer {
  canvas: HTMLCanvasElement;
  fps: number;
  hiRes: boolean;
  redrawRate: number;
  context: CanvasRenderingContext2D;
  constantly: Constantly | null;
  canvasUpdateIsRequired: boolean = false;

  constructor(canvas: HTMLCanvasElement, fps = 25, hiRes = true) {
    super(canvas.width, canvas.height);

    this.canvas = canvas;
    this.fps = fps;
    this.hiRes = hiRes;
    this.redrawRate = 20;
    this.context = canvas.getContext("2d")!;

    this.refresh();

    this.constantly = constantly(() => {
      if (this.canvasUpdateIsRequired) this.update();
    }, this.fps);
  }

  refresh(width?: number, height?: number) {
    width =
      width ||
      this.canvas.offsetWidth * (this.hiRes ? getDevicePixelRatio() : 1);
    height =
      height ||
      this.canvas.offsetHeight * (this.hiRes ? getDevicePixelRatio() : 1);
    this.canvas.width = width;
    this.canvas.height = height;
    this.resizeTo(width, height);
  }

  destroy() {
    if (this.constantly) {
      this.constantly.destroy();
      this.constantly = null;
    }
  }

  update() {
    this.toContext(this.context);
    this.canvasUpdateIsRequired = false;
  }

  getCanvasPoint(x: number, y: number) {
    return {
      x: x * (this.hiRes ? getDevicePixelRatio() : 1),
      y: y * (this.hiRes ? getDevicePixelRatio() : 1),
    };
  }
}
