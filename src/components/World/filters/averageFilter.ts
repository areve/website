export function averageFilter(hsize: [number, number]): number[][] {
  const [rows, cols] = hsize;
  const averageFilter: number[][] = [];
  const value = 1 / (rows * cols);

  // Create the filter
  for (let i = 0; i < rows; i++) {
    averageFilter[i] = [];
    for (let j = 0; j < cols; j++) {
      averageFilter[i][j] = value;
    }
  }

  return averageFilter;
}

