import { fft, inverseFft } from "./fft";
import ImageBuffer from "./image-buffer";

class ComplexBuffer {
  channels: number;
  width: number;
  height: number;
  real: number[];
  imag: number[];
  buffer: ImageBuffer;

  constructor(
    channels: number,
    real: number[],
    imag: number[],
    width: number,
    height: number,
    buffer: ImageBuffer
  ) {
    this.channels = channels;
    this.width = width;
    this.height = height;
    this.real = real || new Array(width * height * 4);
    this.imag = imag || new Array(width * height * 4);
    this.buffer = buffer || new ImageBuffer(this.width, this.height);
  }

  static createFromImageBuffer(buffer: ImageBuffer, channels = 3) {
    const size = buffer.width * buffer.height;
    const real = new Array(buffer.width * buffer.height * 4);
    const imag = new Array(buffer.width * buffer.height * 4);

    const uint8 = buffer.uint8;
    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < channels; ++k) {
        const index = p * 4 + k;
        real[index] = uint8[index] / 255;
        imag[index] = 0;
      }
    }

    return new ComplexBuffer(
      channels,
      real,
      imag,
      buffer.width,
      buffer.height,
      buffer
    );
  }

  static createFromImage(image: HTMLImageElement, channels = 3) {
    const buffer = ImageBuffer.createFromImage(image);
    return ComplexBuffer.createFromImageBuffer(buffer, channels);
  }

  clone() {
    const real = new Array(this.real.length);
    for (let i = 0; i < this.real.length; i++) {
      real[i] = this.real[i];
    }
    const imag = new Array(this.imag.length);
    for (let i = 0; i < this.imag.length; i++) {
      imag[i] = this.imag[i];
    }
    return new ComplexBuffer(
      this.channels,
      real,
      imag,
      this.width,
      this.height
    );
  }

  toBuffer(gamma: number) {
    const buffer = new ImageBuffer(this.width, this.height);

    const real = this.real;
    const uint8 = buffer.uint8;
    const size = this.width * this.height;

    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        let v = real[index];
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        if (gamma) v = Math.pow(v, 1 / gamma);
        uint8[index] = 255 * v;
      }
      uint8[p * 4 + 3] = 255;
    }

    return buffer;
  }

  // magnitude = sqrt(real^2+imaginary^2)
  toMaginitude() {
    const complexBuffer = this.clone();
    const real = complexBuffer.real;
    const imag = complexBuffer.imag;
    const size = complexBuffer.width * complexBuffer.height;

    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        const r = real[index];
        const i = imag[index];
        real[index] = Math.sqrt(r * r + i * i) / size;
        imag[index] = 0;
      }
    }

    return complexBuffer;
  }

  // phase = atan2(imag,real)
  toPhase() {
    const complexBuffer = this.clone();
    const real = complexBuffer.real;
    const imag = complexBuffer.imag;
    const size = complexBuffer.width * complexBuffer.height;
    const pi = Math.PI;

    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        const r = real[index];
        const i = imag[index];
        real[index] = Math.atan2(i, r) / pi / 2 + 0.5; // atan2 then scale -pi...+pi to 0...1;
        imag[index] = 0;
      }
    }

    return complexBuffer;
  }

  ifft() {
    const complexBuffer = this.clone();
    const w = complexBuffer.width;
    const h = complexBuffer.height;
    const real = complexBuffer.real;
    const imag = complexBuffer.imag;

    inverseFft(real, imag, w, h, 4, w * 4, this.channels);
    inverseFft(real, imag, h, w, w * 4, 4, this.channels);

    // inverseFft on ComplexBuffer data scales the data by (w * h), i'm not sure why. Scaling back here makes the data work better in more places.
    const size = w * h;
    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        real[index] = real[index] / size;
        imag[index] = 0;
      }
    }

    return complexBuffer;
  }

  fft() {
    const complexBuffer = this.clone();
    const w = complexBuffer.width;
    const h = complexBuffer.height;
    const real = complexBuffer.real;
    const imag = complexBuffer.imag;

    fft(real, imag, w, h, 4, w * 4, this.channels);
    fft(real, imag, h, w, w * 4, 4, this.channels);

    return complexBuffer;
  }

  autoContrast() {
    const complexBuffer = this.clone();
    const real = complexBuffer.real;
    const w = complexBuffer.width;
    const h = complexBuffer.height;
    const size = w * h;
    const min = [1, 1, 1, 1],
      max = [0, 0, 0, 0];
    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        const r = real[index];
        min[k] = Math.min(r, min[k]);
        max[k] = Math.max(r, max[k]);
      }
    }

    for (let p = 0; p < size; ++p) {
      for (let k = 0; k < this.channels; ++k) {
        const index = p * 4 + k;
        real[index] = (real[index] - min[k]) / (max[k] - min[k]);
      }
    }

    return complexBuffer;
  }
}

export default ComplexBuffer;
