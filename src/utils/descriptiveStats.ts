import { DescriptiveStat } from '../types/clustering';

export function calculateDescriptiveStats(
  data: Record<string, any>[],
  numericColumns: string[]
): DescriptiveStat[] {
  if (!data || data.length === 0 || numericColumns.length === 0) return [];

  return numericColumns.map(col => {
    const rawValues = data
      .map(row => {
        const val = row[col];
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const cleaned = val.trim().replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '');
          const n = Number(cleaned);
          return isNaN(n) ? null : n;
        }
        return null;
      })
      .filter((v): v is number => v !== null && !isNaN(v));

    const count = rawValues.length;
    if (count === 0) {
      return {
        column: col,
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        skewness: 0,
        outliersCount: 0
      };
    }

    const sorted = [...rawValues].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[count - 1];
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    // Variance & StdDev
    const variance =
      count > 1
        ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1)
        : 0;
    const stdDev = Math.sqrt(variance);

    // Median
    const median =
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];

    // Quartiles
    const q1 = sorted[Math.floor(count * 0.25)];
    const q3 = sorted[Math.floor(count * 0.75)];
    const iqr = q3 - q1;

    // Outliers using 1.5 * IQR rule
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliersCount = sorted.filter(v => v < lowerBound || v > upperBound).length;

    // Skewness (Fisher-Pearson coefficient)
    let skewness = 0;
    if (count > 2 && stdDev > 0) {
      const m3 = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / count;
      skewness = m3 / Math.pow(stdDev, 3);
    }

    return {
      column: col,
      count,
      mean: +mean.toFixed(2),
      median: +median.toFixed(2),
      stdDev: +stdDev.toFixed(2),
      min: +min.toFixed(2),
      max: +max.toFixed(2),
      q1: +q1.toFixed(2),
      q3: +q3.toFixed(2),
      iqr: +iqr.toFixed(2),
      skewness: +skewness.toFixed(3),
      outliersCount
    };
  });
}
