// export interface LayerProps extends Dimensions {
//   seed: number;
//   width: number;
//   height: number;
// }

// export interface LayerMethods {
//   pixel: (x: number, y: number) => number[];
// }

export interface Dimensions {
  width: number;
  height: number;
}

export interface Coord {
  x: number;
  y: number;
  z?: number
}
