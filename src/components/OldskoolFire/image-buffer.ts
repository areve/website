type ImageBufferGetPixel = (
  index: number,
  width: number,
  height: number,
  size: number
) => number;

type ImageBufferData =
  | Uint32Array
  | Uint8ClampedArray
  | ImageBufferGetPixel
  | number[]
  | number[][]
  | number;

class ImageBuffer {
  width: number;
  height: number;
  uint32!: Uint32Array;
  uint8!: Uint8ClampedArray;
  isPaused: boolean = false;
  private _fastPutBuffer: any;

  constructor(width: number, height: number, data?: ImageBufferData) {
    this.width = width;
    this.height = height;
    this._createBuffer();
    if (data) this.loadFromUnknownType(data);
  }

  _createBuffer() {
    const buffer = new ArrayBuffer(this.width * this.height * 4);
    this.uint32 = new Uint32Array(buffer);
    this.uint8 = new Uint8ClampedArray(buffer);
  }

  loadFromUnknownType(data: ImageBufferData) {
    if (data instanceof Uint32Array) {
      this.loadFrom1dArray(data);
    } else if (data instanceof Uint8ClampedArray) {
      this.loadFromUint8ClampedArray(data);
    } else if (typeof data === "function") {
      this.loadFromFunction(data);
    } else if (typeof data !== null) {
      if (data instanceof Array) {
        if (data[0] instanceof Array) {
          this.loadFrom2dArray(data as number[][]);
        } else {
          this.loadFrom1dArray(data as number[]);
        }
      } else {
        this.loadFromInteger(data);
      }
    }
  }

  loadFromInteger(integer: number) {
    const size = this.width * this.height;
    for (let i = 0; i < size; ++i) {
      this.uint32[i] = +integer;
    }
  }

  loadFrom1dArray(array1d: number[] | Uint32Array) {
    const size = this.width * this.height;
    for (let i = 0; i < size; ++i) {
      this.uint32[i] = array1d[i];
    }
  }

  loadFrom2dArray(array2d: number[][]) {
    const size = this.width * this.height;
    for (let i = 0; i < size; ++i) {
      this.uint32[i] = array2d[~~(i / this.width)][i % this.width];
    }
  }

  loadFromUint8ClampedArray(uint8clampedArray: Uint8ClampedArray) {
    const size = this.width * this.height;
    for (let i = 0; i < size * 4; ++i) {
      this.uint8[i] = uint8clampedArray[i];
    }
  }

  loadFromFunction(callback: ImageBufferGetPixel) {
    const size = this.width * this.height;
    for (let i = 0; i < size; ++i) {
      this.uint32[i] = callback(i, this.width, this.height, size);
    }
  }

  static createFromImageUrl(
    url: string,
    callback: (buffer: ImageBuffer) => void
  ) {
    const image = document.createElement("img");
    image.src = url;
    image.onload = () => {
      callback(ImageBuffer.createFromImage(image));
    };
  }

  static createFromImage(image: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
    return ImageBuffer.createFromCanvas(canvas);
  }

  static createFromCanvas(canvas: HTMLCanvasElement) {
    const imageData = canvas
      .getContext("2d")!
      .getImageData(0, 0, canvas.width, canvas.height);
    return ImageBuffer.createFromImageData(
      imageData,
      canvas.width,
      canvas.height
    );
  }

  static createFromImageData(
    imageData: ImageData,
    width: number,
    height: number
  ) {
    return new ImageBuffer(width, height, imageData.data);
  }

  clone() {
    return new ImageBuffer(this.width, this.height, this.uint8);
  }

  toCanvas(canvas?: HTMLCanvasElement) {
    canvas = canvas || document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const context = canvas.getContext("2d")!;
    this.toContext(context);
    return canvas;
  }

  toContext(context: CanvasRenderingContext2D) {
    if (
      !this._fastPutBuffer ||
      this._fastPutBuffer.width !== this.width ||
      this._fastPutBuffer.height !== this.height
    ) {
      this._fastPutBuffer = context.createImageData(this.width, this.height);
    }

    this._fastPutBuffer.data.set(this.uint8);
    context.putImageData(this._fastPutBuffer, 0, 0);
  }

  resizeTo(width: number, height: number) {
    const origCanvasClone = this.toCanvas();
    this.isPaused = true;

    this.width = width;
    this.height = height;

    this._createBuffer();

    this.isPaused = false;

    const drawScaleOriginal = (origCanvasClone: CanvasImageSource) => {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(origCanvasClone, 0, 0, this.width, this.height);
      const data = context.getImageData(0, 0, this.width, this.height).data;
      for (let i = 0; i < data.length; i++) {
        this.uint8[i] = data[i];
      }
    };

    drawScaleOriginal.call(this, origCanvasClone);
  }
}

export default ImageBuffer;
