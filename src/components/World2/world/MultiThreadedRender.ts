import { Rgb } from "../lib/color";
import { Camera, Dimensions } from "../lib/render";
import { RenderModel } from "./WorldRender";

const channels = 4;
const threadCount = 4;

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

export abstract class MultiThreadedRender {
  canvas?: OffscreenCanvas;
  context?: OffscreenCanvasRenderingContext2D;
  private dirty: boolean = false;
  private model?: RenderModel;
  private workers: Worker[] = [];
  private arrays: Uint8ClampedArray[] = [];
  private h: number = 0;
  private w: number = 0;

  constructor() {
    this.init();
  }

  abstract createWorker(): Worker;

  private init() {
    self.onmessage = async (
      event: MessageEvent<{
        model: RenderModel;
        canvas?: OffscreenCanvas;
      }>
    ) => {
      const { canvas, model } = event.data;
      console.log('onmessage', canvas, model)
      if (canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d") ?? undefined;
      }

      this.h = Math.ceil(model.dimensions.height / threadCount);
      this.w = model.dimensions.width;
      this.workers = Array.from({ length: threadCount }).map((_) => this.createWorker());
      this.arrays = Array.from({ length: threadCount }).map(
        (_) => new Uint8ClampedArray(this.w * this.h * channels)
      );
      this.model = model;
      this.dirty = true;
      this.update();
    };
  }

  private async update() {
    console.log("update", this.canvas);
    if (!this.dirty || !this.model || !this.canvas) return;

    this.dirty = false;
    const start = self.performance.now();

    this.canvas.width = this.model.dimensions.width;
    this.canvas.height = this.model.dimensions.height;

    const results = await Promise.all(
      this.workers.map((v, i) =>
        this.renderPart(v, this.arrays[i], 0, i * this.h, this.w, this.h)
      )
    );

    this.arrays = results.map((result) => new Uint8ClampedArray(result));

    this.arrays.forEach((a, i) => {
      this.context?.putImageData(
        new ImageData(a, this.w, this.h),
        0,
        i * this.h,
        0,
        0,
        this.w,
        this.h
      );
    });

    const end = self.performance.now();
    self.postMessage({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    } as FrameUpdated);
  }

  private renderPart(
    worker: Worker,
    array: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      worker.postMessage(
        {
          origin: { x, y },
          dimensions: { width, height },
          model: this.model,
          buffer: array.buffer,
        },
        [array.buffer]
      );
      worker.onmessage = (
        ev: MessageEvent<{
          buffer: ArrayBuffer;
        }>
      ) => resolve(ev.data.buffer);
    });
  }
}

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

  private render(
    x: number,
    y: number,
    width: number,
    height: number,
    camera: Camera,
    dimensions: Dimensions
  ): ArrayBuffer {
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
