export function diskFilter(radius: number): number[][] {
  const diameter = 2 * radius + 1;
  const diskFilter: number[][] = [];
  const center = radius;
  let sum = 0;

  // Create the filter
  for (let i = 0; i < diameter; i++) {
      diskFilter[i] = [];
      for (let j = 0; j < diameter; j++) {
          const distance = Math.sqrt((i - center) ** 2 + (j - center) ** 2);
          if (distance <= radius) {
              diskFilter[i][j] = 1;
              sum += 1;
          } else {
              diskFilter[i][j] = 0;
          }
      }
  }

  // Normalize the filter
  for (let i = 0; i < diameter; i++) {
      for (let j = 0; j < diameter; j++) {
          diskFilter[i][j] /= sum;
      }
  }

  return diskFilter;
}

// example usage
// const heightFilterRadius = 20;
// const heightFilter = diskFilter(heightFilterRadius);
// function heights_old_slow(coord: Coord) {
//   // TODO this applyFilter is really good but so slow
//   const { x, y } = coord;
//   let sum = 0;
//   for (let fy = 0; fy < heightFilter.length; fy++) {
//     for (let fx = 0; fx < heightFilter[0].length; fx++) {
//       const px = x + 20 + fx;
//       const py = y + 20 + fy;
//       sum += heightFilter[fy][fx] * generator({ x: px, y: py });
//     }
//   }
//   return ((sum - 0.5) * heightFilterRadius) / 1 + 0.5;
// }