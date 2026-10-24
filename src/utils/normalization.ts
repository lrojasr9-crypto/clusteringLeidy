import { ColumnMetadata, NormalizationMethod, VariableType } from '../types/clustering';

export function inspectColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (!data || data.length === 0) return [];

  const columns = Object.keys(data[0]);

  return columns.map(col => {
    const values = data.map(row => row[col]).filter(v => v !== undefined && v !== null && v !== '');
    const missingCount = data.length - values.length;
    const uniqueValues = new Set(values);
    const uniqueCount = uniqueValues.size;

    // Detect type
    let inferredType: VariableType = 'categorical';
    let numericCount = 0;
    let dateCount = 0;

    for (const val of values.slice(0, 100)) {
      if (typeof val === 'number') {
        numericCount++;
      } else if (typeof val === 'string') {
        const cleaned = val.trim().replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '');
        if (!isNaN(Number(cleaned)) && cleaned.length > 0) {
          numericCount++;
        } else if (!isNaN(Date.parse(val)) && (val.includes('-') || val.includes('/')) && val.length > 6) {
          dateCount++;
        }
      }
    }

    const sampleLength = Math.min(values.length, 100);
    const numericRatio = sampleLength > 0 ? numericCount / sampleLength : 0;
    const dateRatio = sampleLength > 0 ? dateCount / sampleLength : 0;

    const lowerCol = col.toLowerCase();
    const isIdByName = lowerCol.includes('id') || lowerCol.includes('codigo') || lowerCol.includes('rut') || lowerCol.includes('nit') || lowerCol.includes('cuit') || lowerCol.startsWith('num_');
    const isSectorByName = lowerCol.includes('sector') || lowerCol.includes('industria') || lowerCol.includes('rubro') || lowerCol.includes('categoria') || lowerCol.includes('segmento');

    if (isIdByName || (uniqueCount === data.length && values.length > 10)) {
      inferredType = 'identifier';
    } else if (numericRatio >= 0.8) {
      inferredType = 'numeric';
    } else if (dateRatio >= 0.8) {
      inferredType = 'date';
    } else {
      inferredType = 'categorical';
    }

    const isFeature = inferredType === 'numeric' && !isIdByName;

    return {
      name: col,
      type: inferredType,
      inferredType,
      isFeature,
      isSectorColumn: isSectorByName,
      isIdColumn: inferredType === 'identifier',
      uniqueValuesCount: uniqueCount,
      missingCount,
      sampleValues: Array.from(uniqueValues).slice(0, 5)
    };
  });
}

export interface NormalizationParams {
  column: string;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  median: number;
  iqr: number;
}

export function computeColumnNormParams(values: number[], colName: string): NormalizationParams {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return { column: colName, min: 0, max: 1, mean: 0, stdDev: 1, median: 0, iqr: 1 };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1 > 0 ? q3 - q1 : 1;

  return { column: colName, min, max, mean, stdDev, median, iqr };
}

export function normalizeValue(
  value: number,
  method: NormalizationMethod,
  params: NormalizationParams
): number {
  if (isNaN(value)) return 0;
  if (method === 'none') return value;

  if (method === 'minmax') {
    const range = params.max - params.min;
    if (range === 0) return 0.5;
    return (value - params.min) / range;
  }

  if (method === 'zscore') {
    if (params.stdDev === 0) return 0;
    return (value - params.mean) / params.stdDev;
  }

  if (method === 'robust') {
    if (params.iqr === 0) return 0;
    return (value - params.median) / params.iqr;
  }

  return value;
}

export function denormalizeValue(
  normalizedVal: number,
  method: NormalizationMethod,
  params: NormalizationParams
): number {
  if (method === 'none') return normalizedVal;

  if (method === 'minmax') {
    return normalizedVal * (params.max - params.min) + params.min;
  }

  if (method === 'zscore') {
    return normalizedVal * params.stdDev + params.mean;
  }

  if (method === 'robust') {
    return normalizedVal * params.iqr + params.median;
  }

  return normalizedVal;
}
