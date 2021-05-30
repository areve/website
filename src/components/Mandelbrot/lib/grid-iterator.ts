import { Constantly, constantly } from "./constantly";

export interface Point {
  x: number;
  y: number;
}

export default class GridIterator {
  width: number;
  height: number;
  current: Point | null;
  constantly: Constantly | undefined;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.current = null;
  }

  destroy() {
    this.constantly?.destroy();
    this.constantly = undefined;
  }

  next() {
    if (!this.current) {
      this.current = { x: 0, y: 0 };
    } else {
      if (this.current.x == this.width) {
        this.current.x = 0;
        this.current.y++;
      } else if (this.current.y == this.height) {
        this.current = null;
      } else {
        this.current.x++;
      }
    }
    return this.current;
  }

  each(callback: Function) {
    this.constantly = constantly(() => {
      const point = this.next();
      if (!point) this.destroy();
      else callback(point);
    });
  }
}
