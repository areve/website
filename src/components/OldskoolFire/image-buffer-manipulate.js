/* eslint-disable */

import canvasColor from './canvas-color';

const imageBufferManipulate = {
  clear(color) {
    const size = this.width * this.height;
    for (let i = 0; i < size; i++) {
      this.uint32[i] = color;        
    }
    this.canvasUpdateIsRequired = true;
  },

  getPoint(x, y) {
    return this.uint32[~~y * this.width + ~~x];
  },

  setPoint(x, y, color) {
    this.uint32[~~y * this.width + ~~x] = color;
    this.canvasUpdateIsRequired = true;
  },

  subtractPoint(x, y, color) {
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

export default imageBufferManipulate;