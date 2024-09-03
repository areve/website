import { toRaw } from "vue";
import { Rgb } from "./color";
import { Camera, Dimensions } from "./render";
import { renderWorld } from "./world3d/render";

const channels = 4;

export interface RenderSetup {
  model: RenderModel;
  renderService: () => RenderService;
}
export interface RenderModel {
  title: string;
  seed: number;
  frame: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  canvas?: OffscreenCanvas;
}

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

export class MultiThreadedRender {
  canvas?: OffscreenCanvas;
  gl?: WebGLRenderingContext;
  private dirty: boolean = false;
  private busy: boolean = false;
  private model?: RenderModel;
  private workers: Worker[] = [];
  private arrays: Uint8ClampedArray[] = [];
  private h: number = 0;
  private w: number = 0;

  constructor(renderThreadWorkers: Worker[]) {
    this.workers = renderThreadWorkers;
    this.init();
  }

  private init() {
    self.onmessage = async (
      event: MessageEvent<{
        model: RenderModel;
        canvas?: OffscreenCanvas;
      }>
    ) => {
      const { canvas, model } = event.data;
      if (canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl") ?? undefined;
      }

      if (
        !this.model ||
        this.model.dimensions.height != model.dimensions.height ||
        this.model.dimensions.width != model.dimensions.width
      ) {
        this.h = Math.ceil(model.dimensions.height / this.workers.length);
        this.w = model.dimensions.width;
        this.arrays = Array.from({ length: this.workers.length }).map(
          (_) => new Uint8ClampedArray(this.w * this.h * channels)
        );
      }
      this.model = model;
      this.dirty = true;
      this.update();
    };
  }

  private async update() {
    if (!this.dirty || !this.model || !this.canvas || !this.gl) return;
    if (this.busy) return;

    this.busy = true;
    this.dirty = false;
    const start = self.performance.now();

    const gl = this.gl;

    renderWorld(gl)

    // if (
    //   this.canvas.width !== this.model.dimensions.width ||
    //   this.canvas.height !== this.model.dimensions.height
    // ) {
    //   this.canvas.width = this.model.dimensions.width;
    //   this.canvas.height = this.model.dimensions.height;
    //   this.h = Math.ceil(this.model.dimensions.height / this.workers.length);
    //   this.w = this.model.dimensions.width;
    // }

    // const results = await Promise.all(
    //   this.workers.map((v, i) =>
    //     this.renderPart(v, this.arrays[i], 0, i * this.h, this.w, this.h)
    //   )
    // );

    // this.arrays = results.map((result) => new Uint8ClampedArray(result));

    // this.arrays.forEach((a, i) => {
    //   this.context?.putImageData(
    //     new ImageData(a, this.w, this.h),
    //     0,
    //     i * this.h,
    //     0,
    //     0,
    //     this.w,
    //     this.h
    //   );
    // });

    const end = self.performance.now();
    self.postMessage({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    } as FrameUpdated);

    this.busy = false;
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
        []
      );
      worker.onmessage = (
        event: MessageEvent<{
          buffer: ArrayBuffer;
        }>
      ) => resolve(event.data.buffer);
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
      const { model, origin, dimensions, buffer: inBuffer } = event.data;
      this.update(model);

      const buffer = this.render(
        origin.x,
        origin.y,
        dimensions.width,
        dimensions.height,
        model.camera,
        model.dimensions,
        inBuffer
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
    dimensions: Dimensions,
    buffer: ArrayBuffer
  ): ArrayBuffer {
    const cameraX = camera?.x ?? 0;
    const cameraY = camera?.y ?? 0;
    const cameraZoom = camera?.zoom ?? 1;
    const viewportCenterX = dimensions.width / 2 - x;
    const viewportCenterY = dimensions.height / 2 - y;
    const viewportAndCameraX = dimensions.width / 2 + cameraX;
    const viewportAndCameraY = dimensions.height / 2 + cameraY;

    const data = new Uint8ClampedArray(buffer);
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

export class RenderService {
  private worker: Worker;

  public frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(renderWorker: Worker) {
    this.worker = renderWorker;
  }

  init(canvas: HTMLCanvasElement, model: RenderModel) {
    this.worker.onmessage = (event: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(event.data);
    };

    const offscreenCanvas = canvas.transferControlToOffscreen();
    this.worker.postMessage({ model: toRaw(model), canvas: offscreenCanvas }, [
      offscreenCanvas,
    ]);
  }

  update(model: RenderModel): void {
    this.worker.postMessage({ model: toRaw(model) });
  }
}

