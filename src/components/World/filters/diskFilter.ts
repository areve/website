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