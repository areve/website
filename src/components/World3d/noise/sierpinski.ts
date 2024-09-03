export const makeSierpinskiGenerator = (seed: number) => {
  return (x: number, y: number): number => {
    let xN = x;
    let yN = y;

    let inside = true;
    while (xN > 0 || yN > 0) {
      if (xN % 2 === 1 && yN % 2 === 1) {
        inside = false;
        break;
      }
      xN = Math.floor(xN / 2);
      yN = Math.floor(yN / 2);
    }

    return inside ? 1 : 0;
  };
};
