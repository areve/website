/* eslint-disable */

export default {
  fromRGB(r, g, b) {
    return (255 << 24) |
      (b << 16) |
      (g << 8) |
      r;
  },
  toRGB(uint) {
    return { 
      r: uint & 255,
      g: (uint >> 8) & 255,
      b: (uint >> 16) & 255
    }; 
  }
};
