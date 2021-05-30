import GridIterator, { Point } from "./grid-iterator";

export interface ComplexNumber {
  r: number;
  i: number;
}

export type ComplexPoint = ComplexNumber & Point;

export default class ComplexGridIterator extends GridIterator {
  realMin: number;
  imagMin: number;
  realMax: number;
  imagMax: number;

  constructor(
    width: number,
    height: number,
    realMin: number,
    imagMin: number,
    realMax: number,
    imagMax: number
  ) {
    super(width, height);
    this.realMin = realMin;
    this.imagMin = imagMin;
    this.realMax = realMax;
    this.imagMax = imagMax;
  }

  each(callback: (point: ComplexPoint) => void) {
    return GridIterator.prototype.each.call(this, (point: Point) => {
      callback(this.toComplex(point.x, point.y));
    });
  }

  toComplex(x: number, y: number): ComplexPoint {
    const r =
      (x / this.width) * (this.realMax - this.realMin * 1) + this.realMin * 1;
    const i = (y / this.height) * (this.imagMax - this.imagMin) + this.imagMin;

    return { x, y, r, i };
  }
}
