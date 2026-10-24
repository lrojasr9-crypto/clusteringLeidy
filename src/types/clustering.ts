export type VariableType = 'numeric' | 'categorical' | 'identifier' | 'date';

export type NormalizationMethod = 'minmax' | 'zscore' | 'robust' | 'none';

export interface ColumnMetadata {
  name: string;
  type: VariableType;
  inferredType: VariableType;
  isFeature: boolean; // used in clustering
  isSectorColumn?: boolean;
  isIdColumn?: boolean;
  uniqueValuesCount: number;
  missingCount: number;
  sampleValues: (string | number)[];
}

export interface DescriptiveStat {
  column: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  outliersCount: number;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  column: string;
  operator: '>' | '<' | '>=' | '<=' | '!=' | '==' | 'between' | 'not_empty';
  threshold: number | string;
  thresholdMax?: number; // for between
  severity: 'critical' | 'warning' | 'info';
  businessObjective: string;
}

export interface RuleViolation {
  rowIndex: number;
  rowId: string | number;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  column: string;
  actualValue: any;
  message: string;
}

export interface ClusterCentroid {
  clusterIndex: number;
  name: string;
  color: string;
  normalizedCoords: Record<string, number>;
  originalCoords: Record<string, number>;
  size: number;
  percentage: number;
}

export interface ClusterPoint {
  id: string | number;
  rowIndex: number;
  raw: Record<string, any>;
  normalized: Record<string, number>;
  cluster: number;
  distanceToCentroid: number;
  nearestNeighbors?: { index: number; distance: number }[];
}

export interface ClusterStrategy {
  clusterIndex: number;
  clusterName: string;
  archetype: string;
  sectorFocus: string;
  summary: string;
  keyMetrics: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  producto: {
    titulo: string;
    acciones: string[];
    kpis: string[];
  };
  precio: {
    titulo: string;
    acciones: string[];
    kpis: string[];
  };
  innovacion: {
    titulo: string;
    acciones: string[];
    kpis: string[];
  };
  comunicacion: {
    titulo: string;
    acciones: string[];
    kpis: string[];
  };
  rentabilidad: {
    titulo: string;
    acciones: string[];
    kpis: string[];
  };
}

export interface ClusteringResult {
  k: number;
  iterations: number;
  wcss: number; // Within-cluster sum of squares (Inertia)
  silhouetteScore: number;
  centroids: ClusterCentroid[];
  points: ClusterPoint[];
  featuresUsed: string[];
  normalizationMethod: NormalizationMethod;
  elbowData: { k: number; wcss: number; silhouette: number }[];
  strategies: ClusterStrategy[];
  sectorDistribution: Record<number, Record<string, number>>; // cluster -> sector -> count
}

export interface DatasetPreset {
  id: string;
  name: string;
  sector: string;
  description: string;
  suggestedFeatures: string[];
  sectorColumn: string;
  idColumn: string;
  data: Record<string, any>[];
  suggestedRules: BusinessRule[];
}
