import React, { useState, useMemo } from 'react';
import {
  ClusteringResult,
  ClusterPoint,
  ClusterCentroid
} from '../types/clustering';
import {
  ScatterChart,
  Target,
  Sparkles,
  TrendingDown,
  Compass,
  ArrowRight,
  Crosshair,
  UserCheck,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { classifyPointWithKNN } from '../utils/kmeansEngine';

interface ClusteringWorkspaceProps {
  clusteringResult: ClusteringResult;
  selectedK: number;
  onUpdateK: (newK: number) => void;
  features: string[];
  sectorColumn?: string;
  onNext: () => void;
}

export const ClusteringWorkspace: React.FC<ClusteringWorkspaceProps> = ({
  clusteringResult,
  selectedK,
  onUpdateK,
  features,
  sectorColumn,
  onNext
}) => {
  // Scatter plot axes
  const [xAxisFeature, setXAxisFeature] = useState<string>(features[0] || '');
  const [yAxisFeature, setYAxisFeature] = useState<string>(features[1] || features[0] || '');
  const [colorBy, setColorBy] = useState<'cluster' | 'sector'>('cluster');
  const [selectedPoint, setSelectedPoint] = useState<ClusterPoint | null>(null);

  // KNN Predictor state
  const [knnInputs, setKnnInputs] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    features.forEach(f => {
      // default to first centroid's value
      initial[f] = clusteringResult.centroids[0]?.originalCoords[f] || 0;
    });
    return initial;
  });

  const knnPrediction = useMemo(() => {
    if (!clusteringResult.centroids || clusteringResult.centroids.length === 0) return null;
    return classifyPointWithKNN(knnInputs, clusteringResult.centroids, features);
  }, [knnInputs, clusteringResult.centroids, features]);

  // Compute bounding boxes for scatter plot normalization into SVG coordinate space [0, 100]
  const scatterBounds = useMemo(() => {
    const xVals = clusteringResult.points.map(p => Number(p.raw[xAxisFeature]) || 0);
    const yVals = clusteringResult.points.map(p => Number(p.raw[yAxisFeature]) || 0);

    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    return {
      xMin,
      xMax: xMax === xMin ? xMin + 1 : xMax,
      yMin,
      yMax: yMax === yMin ? yMin + 1 : yMax
    };
  }, [clusteringResult.points, xAxisFeature, yAxisFeature]);

  // Map distinct sectors to unique colors
  const sectorColors = useMemo(() => {
    const map: Record<string, string> = {};
    const palette = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    let idx = 0;
    clusteringResult.points.forEach(p => {
      const sec = sectorColumn && p.raw[sectorColumn] ? String(p.raw[sectorColumn]) : 'General';
      if (!map[sec]) {
        map[sec] = palette[idx % palette.length];
        idx++;
      }
    });
    return map;
  }, [clusteringResult.points, sectorColumn]);

  // SVG coordinate transformation
  const getSvgCoords = (rawX: number, rawY: number) => {
    const padding = 10;
    const innerW = 100 - padding * 2;
    const innerH = 100 - padding * 2;

    const normX = (rawX - scatterBounds.xMin) / (scatterBounds.xMax - scatterBounds.xMin);
    const normY = (rawY - scatterBounds.yMin) / (scatterBounds.yMax - scatterBounds.yMin);

    const svgX = padding + normX * innerW;
    const svgY = 100 - (padding + normY * innerH); // Invert Y for SVG

    return { svgX, svgY };
  };

  // Find elbow knee point recommendation
  const recommendedK = useMemo(() => {
    if (!clusteringResult.elbowData || clusteringResult.elbowData.length < 2) return 3;
    // Pick the point with highest silhouette or classic elbow
    const sortedBySil = [...clusteringResult.elbowData].sort((a, b) => b.silhouette - a.silhouette);
    return sortedBySil[0]?.k || 3;
  }, [clusteringResult.elbowData]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              Modelo de Clustering (K-Means &amp; KNN Euclídeo)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Optimización de centroides iterativos mediante distancia euclídea normalizada. Explora el gráfico de dispersión y la recomendación de K óptimo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <span>Ver Perfiles por Sector</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* K Selector & Elbow Method Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 pt-4 border-t border-slate-100 items-center">
          <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Número de Clústers (K):</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                K = {selectedK} Seleccionado
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[2, 3, 4, 5, 6].map(kVal => (
                <button
                  key={kVal}
                  onClick={() => onUpdateK(kVal)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative ${
                    selectedK === kVal
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>K = {kVal}</span>
                  {kVal === recommendedK && (
                    <span className="text-[9px] text-amber-300 font-normal">★ Óptimo</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
              <span>Inercia WCSS: <b>{clusteringResult.wcss}</b></span>
              <span>Silhouette: <b>{clusteringResult.silhouetteScore}</b></span>
              <span>Iteraciones: <b>{clusteringResult.iterations}</b></span>
            </div>
          </div>

          {/* Elbow Chart Graphic */}
          <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                Curva del Codo (Elbow Curve) &amp; Silhouette
              </span>
              <span className="text-[10px] text-slate-500">K recomendado: <b>K={recommendedK}</b></span>
            </div>

            <div className="flex items-end justify-between h-20 gap-3 pt-3 px-2">
              {clusteringResult.elbowData.map(pt => {
                const maxWcss = Math.max(...clusteringResult.elbowData.map(d => d.wcss));
                const heightPct = Math.max(15, Math.round((pt.wcss / (maxWcss || 1)) * 100));
                const isCurrent = pt.k === selectedK;
                const isBest = pt.k === recommendedK;

                return (
                  <button
                    key={pt.k}
                    onClick={() => onUpdateK(pt.k)}
                    className="flex-1 flex flex-col items-center gap-1 group text-left cursor-pointer"
                  >
                    <div className="w-full bg-slate-200 rounded-t h-14 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full transition-all rounded-t ${
                          isCurrent
                            ? 'bg-blue-600'
                            : isBest
                            ? 'bg-indigo-400 group-hover:bg-indigo-500'
                            : 'bg-slate-400 group-hover:bg-slate-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isCurrent ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      K={pt.k}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2D Scatter Plot & Point Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot Visualizer */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ScatterChart className="w-4 h-4 text-blue-600" />
                Gráfico de Dispersión Multidimensional 2D
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona los ejes X e Y para visualizar la separación espacial de los centroides euclídeos.
              </p>
            </div>

            {/* Color by switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setColorBy('cluster')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  colorBy === 'cluster'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Clúster
              </button>
              {sectorColumn && (
                <button
                  onClick={() => setColorBy('sector')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    colorBy === 'sector'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Sector
                </button>
              )}
            </div>
          </div>

          {/* Axes Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Eje Horizontal (X):
              </label>
              <select
                value={xAxisFeature}
                onChange={e => setXAxisFeature(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {features.map(f => (
                  <option key={f} value={f}>
                    {f.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Eje Vertical (Y):
              </label>
              <select
                value={yAxisFeature}
                onChange={e => setYAxisFeature(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {features.map(f => (
                  <option key={f} value={f}>
                    {f.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SVG Canvas Scatter Plot */}
          <div className="relative w-full aspect-square md:aspect-video bg-slate-900 rounded-xl p-4 overflow-hidden border border-slate-800 flex flex-col justify-between">
            {/* Axis Labels in SVG overlay */}
            <div className="absolute top-2 left-4 text-[10px] font-mono text-slate-400 z-10 flex items-center gap-1.5">
              <span>▲ Eje Y: {yAxisFeature.replace(/_/g, ' ')}</span>
              <span className="text-slate-600">[{scatterBounds.yMin.toLocaleString()} → {scatterBounds.yMax.toLocaleString()}]</span>
            </div>

            <div className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-400 z-10 flex items-center gap-1.5">
              <span>Eje X: {xAxisFeature.replace(/_/g, ' ')} ▶</span>
              <span className="text-slate-600">[{scatterBounds.xMin.toLocaleString()} → {scatterBounds.xMax.toLocaleString()}]</span>
            </div>

            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="10" y1="10" x2="10" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />
              <line x1="90" y1="10" x2="90" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />

              <line x1="10" y1="10" x2="90" y2="10" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />
              <line x1="10" y1="90" x2="90" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,1" />

              {/* Data points */}
              {clusteringResult.points.map((pt) => {
                const rawX = Number(pt.raw[xAxisFeature]) || 0;
                const rawY = Number(pt.raw[yAxisFeature]) || 0;
                const { svgX, svgY } = getSvgCoords(rawX, rawY);

                const centroid = clusteringResult.centroids[pt.cluster];
                const sec = sectorColumn && pt.raw[sectorColumn] ? String(pt.raw[sectorColumn]) : 'General';
                const fillColor = colorBy === 'cluster' ? (centroid?.color || '#3B82F6') : (sectorColors[sec] || '#3B82F6');
                const isSelected = selectedPoint?.rowIndex === pt.rowIndex;

                return (
                  <circle
                    key={pt.rowIndex}
                    cx={svgX}
                    cy={svgY}
                    r={isSelected ? 3.5 : 2}
                    fill={fillColor}
                    fillOpacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? '#FFFFFF' : '#0F172A'}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    onClick={() => setSelectedPoint(pt)}
                    className="cursor-pointer hover:scale-150 transition-transform"
                  >
                    <title>{`ID: ${pt.id} | Clúster: ${pt.cluster + 1} | ${xAxisFeature}: ${rawX} | ${yAxisFeature}: ${rawY}`}</title>
                  </circle>
                );
              })}

              {/* Centroids markers */}
              {clusteringResult.centroids.map((c) => {
                const cX = c.originalCoords[xAxisFeature] || 0;
                const cY = c.originalCoords[yAxisFeature] || 0;
                const { svgX, svgY } = getSvgCoords(cX, cY);

                return (
                  <g key={c.clusterIndex} className="pointer-events-none">
                    {/* Pulsing ring */}
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="6"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.8"
                    />
                    {/* Centroid core */}
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="3.5"
                      fill={c.color}
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                    />
                    <text
                      x={svgX + 4}
                      y={svgY - 3}
                      fill="#FFFFFF"
                      fontSize="3.5"
                      fontWeight="bold"
                      className="drop-shadow"
                    >
                      C{c.clusterIndex + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {colorBy === 'cluster' ? (
              clusteringResult.centroids.map(c => (
                <div key={c.clusterIndex} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-semibold text-slate-700">{c.name}</span>
                  <span className="text-[11px] text-slate-400">({c.percentage}%)</span>
                </div>
              ))
            ) : (
              Object.entries(sectorColors).map(([sec, col]) => (
                <div key={sec} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: col }}
                  />
                  <span className="text-slate-700 font-medium">{sec}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel: Point Inspector or KNN Classifier */}
        <div className="lg:col-span-4 space-y-5">
          {/* Selected Point Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Inspector de Observación (Haz clic en un punto)
            </h4>

            {selectedPoint ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Identificador</span>
                    <div className="font-bold text-slate-800 text-sm">{selectedPoint.id}</div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-xs"
                    style={{
                      backgroundColor:
                        clusteringResult.centroids[selectedPoint.cluster]?.color || '#2563EB'
                    }}
                  >
                    Clúster {selectedPoint.cluster + 1}
                  </span>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">Distancia Euclídea al Centroide:</div>
                  <div className="font-mono bg-blue-50 text-blue-800 p-1.5 rounded text-[11px] font-semibold">
                    d(x, C{selectedPoint.cluster + 1}) = {selectedPoint.distanceToCentroid}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Valores Reales:</span>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 max-h-36 overflow-y-auto space-y-1 text-[11px]">
                    {features.map(f => (
                      <div key={f} className="flex justify-between">
                        <span className="text-slate-500">{f.replace(/_/g, ' ')}:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {Number(selectedPoint.raw[f])?.toLocaleString('es-ES') || selectedPoint.raw[f]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Selecciona cualquier punto en el gráfico para inspeccionar su pertenencia de clúster y distancias euclídeas.
              </div>
            )}
          </div>

          {/* Interactive KNN Classifier for new observations */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                Simulador KNN (Clasificar Nuevo Cliente)
              </h4>
            </div>

            <p className="text-[11px] text-slate-500">
              Ingresa valores hipotéticos para clasificar automáticamente a un cliente según distancia euclídea:
            </p>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {features.map(f => (
                <div key={f} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 truncate max-w-[120px]" title={f}>
                    {f.replace(/_/g, ' ')}:
                  </span>
                  <input
                    type="number"
                    value={knnInputs[f] !== undefined ? knnInputs[f] : 0}
                    onChange={e =>
                      setKnnInputs(prev => ({
                        ...prev,
                        [f]: Number(e.target.value) || 0
                      }))
                    }
                    className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {knnPrediction && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-[10px] text-indigo-700 font-semibold uppercase">Clasificación KNN:</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-indigo-950">
                    {knnPrediction.nearestCentroid.name}
                  </span>
                  <span className="text-xs font-mono font-semibold text-indigo-700">
                    Dist: {knnPrediction.distance}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centroids Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Tabla de Centroides Calculados (Coordenadas Reales de Negocio)
          </h3>
          <p className="text-xs text-slate-500">
            Valores promedio representativos en unidades reales para cada grupo estratégico.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Clúster</th>
                <th className="py-2.5 px-4">Tamaño</th>
                <th className="py-2.5 px-4">% Cartera</th>
                {features.map(f => (
                  <th key={f} className="py-2.5 px-3 text-right">
                    {f.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {clusteringResult.centroids.map(c => (
                <tr key={c.clusterIndex} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{c.size}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                      {c.percentage}%
                    </span>
                  </td>
                  {features.map(f => {
                    const origVal = c.originalCoords[f];
                    return (
                      <td key={f} className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                        {typeof origVal === 'number'
                          ? origVal.toLocaleString('es-ES')
                          : String(origVal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
