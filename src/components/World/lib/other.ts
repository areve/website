import { PRNG } from "./prng";

export const sum = (array: number[]) => array.reduce((p, c) => p + c, 0);
export const xor = (a: Uint8Array, b: Uint8Array) => a.map((v, i) => v ^ b[i]);



export function getCells(width: number, height: number, seed: Uint8Array, totalWeight: number) {
  const generator = new PRNG(seed);
  const cellStates = generator.getStateArray(width * height);
  const cellIntegers = cellStates.map(
    (v) => ((v[0] << 24) | (v[1] << 16) | (v[2] << 8) | v[3]) >>> 0
  );
  const sumCellIntegers = sum(cellIntegers);
  let cellWeights = cellIntegers.map(
    (v) => ((totalWeight * v) / sumCellIntegers) as number
  );
  let layerState = generator.getState();
  return {
    cellWeights,
    cellIntegers,
    cellStates,
    stats: {
      totalWeight,
      sumCellIntegers,
      layerState,
    },
  };
}



export interface Cells {
  cellWeights: number[];
  cellIntegers: number[];
  cellStates: Uint8Array[];
  stats: {
    totalWeight: number;
    sumCellIntegers: number;
    layerState: Uint8Array;
  };
}