import {
  ClusterCentroid,
  ClusterPoint,
  ClusteringResult,
  NormalizationMethod
} from '../types/clustering';
import {
  computeColumnNormParams,
  denormalizeValue,
  NormalizationParams,
  normalizeValue
} from './normalization';
import { generateClusterStrategies } from './strategyGenerator';

export const CLUSTER_COLORS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1'  // Indigo
];

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function runKMeans(
  data: Record<string, any>[],
  features: string[],
  k: number,
  normMethod: NormalizationMethod = 'minmax',
  idColumn?: string,
  sectorColumn?: string,
  maxIterations: number = 40
): ClusteringResult {
  if (!data || data.length === 0 || features.length === 0 || k < 1) {
    throw new Error('Datos o variables insuficientes para el análisis de clustering.');
  }

  const effectiveK = Math.min(k, data.length);

  // 1. Compute normalization parameters per feature
  const normParamsMap: Record<string, NormalizationParams> = {};
  features.forEach(f => {
    const vals = data
      .map(row => {
        const val = row[f];
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
      });
    normParamsMap[f] = computeColumnNormParams(vals, f);
  });

  // 2. Prepare normalized vectors
  const normalizedVectors: number[][] = [];
  const normalizedRecords: Record<string, number>[] = [];

  data.forEach(row => {
    const vec: number[] = [];
    const rec: Record<string, number> = {};
    features.forEach(f => {
      let val = row[f];
      if (typeof val !== 'number') {
        const cleaned = String(val).replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '');
        val = Number(cleaned) || 0;
      }
      const normVal = normalizeValue(val, normMethod, normParamsMap[f]);
      vec.push(normVal);
      rec[f] = normVal;
    });
    normalizedVectors.push(vec);
    normalizedRecords.push(rec);
  });

  // 3. Initialize centroids using K-Means++ deterministic algorithm
  const centroidVectors: number[][] = [];
  // Pick first centroid: the point closest to the overall mean vector
  const overallMean = features.map((_, colIdx) => {
    return normalizedVectors.reduce((acc, v) => acc + v[colIdx], 0) / normalizedVectors.length;
  });
  let firstIdx = 0;
  let minMeanDist = Infinity;
  normalizedVectors.forEach((v, idx) => {
    const dist = euclideanDistance(v, overallMean);
    if (dist < minMeanDist) {
      minMeanDist = dist;
      firstIdx = idx;
    }
  });
  centroidVectors.push([...normalizedVectors[firstIdx]]);

  // Pick remaining centroids farthest from existing centroids
  while (centroidVectors.length < effectiveK) {
    let farthestIdx = 0;
    let maxDistSq = -1;

    for (let i = 0; i < normalizedVectors.length; i++) {
      let minDistToAnyCentroid = Infinity;
      for (const c of centroidVectors) {
        const d = euclideanDistance(normalizedVectors[i], c);
        if (d < minDistToAnyCentroid) {
          minDistToAnyCentroid = d;
        }
      }
      const distSq = minDistToAnyCentroid * minDistToAnyCentroid;
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        farthestIdx = i;
      }
    }
    centroidVectors.push([...normalizedVectors[farthestIdx]]);
  }

  // 4. Run iterations
  let clusterAssignments = new Array(normalizedVectors.length).fill(0);
  let iterations = 0;
  let converged = false;

  while (iterations < maxIterations && !converged) {
    iterations++;

    // Assignment step
    let changed = false;
    for (let i = 0; i < normalizedVectors.length; i++) {
      let closestCluster = 0;
      let minDistance = Infinity;

      for (let cIdx = 0; cIdx < centroidVectors.length; cIdx++) {
        const dist = euclideanDistance(normalizedVectors[i], centroidVectors[cIdx]);
        if (dist < minDistance) {
          minDistance = dist;
          closestCluster = cIdx;
        }
      }

      if (clusterAssignments[i] !== closestCluster) {
        changed = true;
        clusterAssignments[i] = closestCluster;
      }
    }

    if (!changed) {
      converged = true;
      break;
    }

    // Update centroids step
    const newCentroids: number[][] = [];
    for (let cIdx = 0; cIdx < effectiveK; cIdx++) {
      const assignedPoints = normalizedVectors.filter((_, idx) => clusterAssignments[idx] === cIdx);
      if (assignedPoints.length === 0) {
        newCentroids.push([...centroidVectors[cIdx]]);
        continue;
      }

      const meanVec = features.map((_, colIdx) => {
        return assignedPoints.reduce((sum, pt) => sum + pt[colIdx], 0) / assignedPoints.length;
      });
      newCentroids.push(meanVec);
    }

    // Check shift
    let maxShift = 0;
    for (let cIdx = 0; cIdx < effectiveK; cIdx++) {
      const shift = euclideanDistance(centroidVectors[cIdx], newCentroids[cIdx]);
      if (shift > maxShift) maxShift = shift;
    }

    for (let cIdx = 0; cIdx < effectiveK; cIdx++) {
      centroidVectors[cIdx] = newCentroids[cIdx];
    }

    if (maxShift < 1e-4) {
      converged = true;
    }
  }

  // 5. Calculate WCSS (Inertia) & point distances
  let totalWcss = 0;
  const points: ClusterPoint[] = [];

  normalizedVectors.forEach((vec, idx) => {
    const cIdx = clusterAssignments[idx];
    const dist = euclideanDistance(vec, centroidVectors[cIdx]);
    totalWcss += dist * dist;

    // Optional KNN neighbors (top 3 nearest neighbors)
    const neighbors: { index: number; distance: number }[] = [];
    for (let j = 0; j < normalizedVectors.length; j++) {
      if (j !== idx) {
        neighbors.push({ index: j, distance: euclideanDistance(vec, normalizedVectors[j]) });
      }
    }
    neighbors.sort((a, b) => a.distance - b.distance);

    const rowId = idColumn && data[idx][idColumn] !== undefined ? data[idx][idColumn] : `#${idx + 1}`;

    points.push({
      id: rowId,
      rowIndex: idx,
      raw: data[idx],
      normalized: normalizedRecords[idx],
      cluster: cIdx,
      distanceToCentroid: +dist.toFixed(4),
      nearestNeighbors: neighbors.slice(0, 3)
    });
  });

  // 6. Calculate Silhouette score
  const silhouetteScore = calculateSilhouetteScore(normalizedVectors, clusterAssignments, effectiveK);

  // 7. Format Centroids with both normalized and denormalized values
  const centroids: ClusterCentroid[] = centroidVectors.map((cVec, cIdx) => {
    const count = clusterAssignments.filter(c => c === cIdx).length;
    const normCoords: Record<string, number> = {};
    const origCoords: Record<string, number> = {};

    features.forEach((f, fIdx) => {
      const nVal = cVec[fIdx];
      normCoords[f] = +nVal.toFixed(3);
      origCoords[f] = +denormalizeValue(nVal, normMethod, normParamsMap[f]).toFixed(2);
    });

    return {
      clusterIndex: cIdx,
      name: `Clúster ${cIdx + 1}`,
      color: CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length],
      normalizedCoords: normCoords,
      originalCoords: origCoords,
      size: count,
      percentage: +((count / data.length) * 100).toFixed(1)
    };
  });

  // 8. Sector Distribution matrix
  const sectorDistribution: Record<number, Record<string, number>> = {};
  for (let c = 0; c < effectiveK; c++) {
    sectorDistribution[c] = {};
  }

  data.forEach((row, idx) => {
    const cIdx = clusterAssignments[idx];
    const sec = sectorColumn && row[sectorColumn] ? String(row[sectorColumn]) : 'General';
    sectorDistribution[cIdx][sec] = (sectorDistribution[cIdx][sec] || 0) + 1;
  });

  // 9. Generate Elbow curve points for K from 2 to 6
  const elbowData = calculateElbowCurve(data, features, normMethod, idColumn, sectorColumn);

  // 10. Generate 5-Pillar Strategic Playbooks
  const strategies = generateClusterStrategies(centroids, points, features, sectorColumn);

  return {
    k: effectiveK,
    iterations,
    wcss: +totalWcss.toFixed(3),
    silhouetteScore: +silhouetteScore.toFixed(3),
    centroids,
    points,
    featuresUsed: features,
    normalizationMethod: normMethod,
    elbowData,
    strategies,
    sectorDistribution
  };
}

function calculateSilhouetteScore(vectors: number[][], assignments: number[], k: number): number {
  if (k <= 1 || vectors.length <= k) return 0;

  const n = vectors.length;
  // If dataset is large, sample up to 150 points for quick computation
  const sampleIndices = n > 150 ? Array.from({ length: 150 }, () => Math.floor(Math.random() * n)) : Array.from({ length: n }, (_, i) => i);

  let totalScore = 0;

  for (const i of sampleIndices) {
    const clusterI = assignments[i];
    const sameCluster = [];
    const otherClusters: Record<number, number[]> = {};

    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const dist = euclideanDistance(vectors[i], vectors[j]);
      if (assignments[j] === clusterI) {
        sameCluster.push(dist);
      } else {
        if (!otherClusters[assignments[j]]) otherClusters[assignments[j]] = [];
        otherClusters[assignments[j]].push(dist);
      }
    }

    if (sameCluster.length === 0) continue;

    const a_i = sameCluster.reduce((sum, d) => sum + d, 0) / sameCluster.length;

    let b_i = Infinity;
    Object.keys(otherClusters).forEach(cKey => {
      const dists = otherClusters[Number(cKey)];
      if (dists && dists.length > 0) {
        const meanDist = dists.reduce((sum, d) => sum + d, 0) / dists.length;
        if (meanDist < b_i) b_i = meanDist;
      }
    });

    if (b_i === Infinity) b_i = 0;

    const maxVal = Math.max(a_i, b_i);
    const s_i = maxVal === 0 ? 0 : (b_i - a_i) / maxVal;
    totalScore += s_i;
  }

  return totalScore / sampleIndices.length;
}

function calculateElbowCurve(
  data: Record<string, any>[],
  features: string[],
  normMethod: NormalizationMethod,
  idColumn?: string,
  sectorColumn?: string
): { k: number; wcss: number; silhouette: number }[] {
  const result: { k: number; wcss: number; silhouette: number }[] = [];
  const maxK = Math.min(6, Math.max(2, data.length - 1));

  for (let testK = 2; testK <= maxK; testK++) {
    try {
      const res = runFastKMeans(data, features, testK, normMethod);
      result.push({
        k: testK,
        wcss: +res.wcss.toFixed(2),
        silhouette: +res.silhouette.toFixed(2)
      });
    } catch {
      // Ignore if k is too large
    }
  }

  return result;
}

// Lightweight K-means without recursive elbow or strategy generation
function runFastKMeans(
  data: Record<string, any>[],
  features: string[],
  k: number,
  normMethod: NormalizationMethod
): { wcss: number; silhouette: number } {
  const normParamsMap: Record<string, NormalizationParams> = {};
  features.forEach(f => {
    const vals = data.map(row => Number(row[f]) || 0);
    normParamsMap[f] = computeColumnNormParams(vals, f);
  });

  const vectors: number[][] = data.map(row => {
    return features.map(f => normalizeValue(Number(row[f]) || 0, normMethod, normParamsMap[f]));
  });

  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const pickIdx = Math.floor((i * vectors.length) / k);
    centroids.push([...vectors[pickIdx]]);
  }

  const assignments = new Array(vectors.length).fill(0);
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < vectors.length; i++) {
      let closest = 0;
      let minD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = euclideanDistance(vectors[i], centroids[c]);
        if (d < minD) {
          minD = d;
          closest = c;
        }
      }
      assignments[i] = closest;
    }

    for (let c = 0; c < k; c++) {
      const pts = vectors.filter((_, idx) => assignments[idx] === c);
      if (pts.length > 0) {
        centroids[c] = features.map((_, colIdx) => pts.reduce((sum, p) => sum + p[colIdx], 0) / pts.length);
      }
    }
  }

  let wcss = 0;
  vectors.forEach((v, i) => {
    const d = euclideanDistance(v, centroids[assignments[i]]);
    wcss += d * d;
  });

  const silhouette = calculateSilhouetteScore(vectors, assignments, k);

  return { wcss, silhouette };
}

/**
 * KNN Classifier for a new or test data point
 * Uses Euclidean distance to existing centroids or nearest neighbors
 */
export function classifyPointWithKNN(
  newValues: Record<string, number>,
  centroids: ClusterCentroid[],
  features: string[]
): {
  assignedCluster: number;
  nearestCentroid: ClusterCentroid;
  distance: number;
  allDistances: { clusterIndex: number; name: string; distance: number }[];
} {
  const distances = centroids.map(c => {
    let sum = 0;
    features.forEach(f => {
      const v1 = newValues[f] !== undefined ? newValues[f] : 0;
      const v2 = c.originalCoords[f] !== undefined ? c.originalCoords[f] : 0;
      const diff = v1 - v2;
      sum += diff * diff;
    });
    const dist = Math.sqrt(sum);
    return {
      clusterIndex: c.clusterIndex,
      name: c.name,
      distance: +dist.toFixed(3)
    };
  });

  distances.sort((a, b) => a.distance - b.distance);
  const nearest = centroids.find(c => c.clusterIndex === distances[0].clusterIndex)!;

  return {
    assignedCluster: distances[0].clusterIndex,
    nearestCentroid: nearest,
    distance: distances[0].distance,
    allDistances: distances
  };
}
