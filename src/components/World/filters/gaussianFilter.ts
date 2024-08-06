export function gaussianFilter(m: number, n: number, sigma: number): number[][] {
    const gaussianFilter: number[][] = [];
    const meanX = Math.floor(m / 2);
    const meanY = Math.floor(n / 2);
    let sum = 0;

    // Create the filter
    for (let i = 0; i < m; i++) {
        gaussianFilter[i] = [];
        for (let j = 0; j < n; j++) {
            const x = i - meanX;
            const y = j - meanY;
            gaussianFilter[i][j] = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
            sum += gaussianFilter[i][j];
        }
    }

    // Normalize the filter
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            gaussianFilter[i][j] /= sum;
        }
    }

    return gaussianFilter;
}
