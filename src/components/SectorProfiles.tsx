import React, { useState, useMemo } from 'react';
import {
  ClusteringResult,
  ClusterStrategy
} from '../types/clustering';
import {
  Building,
  Users,
  PieChart,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Filter
} from 'lucide-react';

interface SectorProfilesProps {
  clusteringResult: ClusteringResult;
  sectorColumn?: string;
  onNext: () => void;
}

export const SectorProfiles: React.FC<SectorProfilesProps> = ({
  clusteringResult,
  sectorColumn,
  onNext
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // Extract distinct sectors
  const allSectors = useMemo(() => {
    const set = new Set<string>();
    clusteringResult.points.forEach(p => {
      const sec = sectorColumn && p.raw[sectorColumn] ? String(p.raw[sectorColumn]) : 'General';
      set.add(sec);
    });
    return Array.from(set);
  }, [clusteringResult.points, sectorColumn]);

  // Filtered points
  const displayPoints = useMemo(() => {
    if (selectedSector === 'all') return clusteringResult.points;
    return clusteringResult.points.filter(
      p => (sectorColumn && p.raw[sectorColumn] ? String(p.raw[sectorColumn]) : 'General') === selectedSector
    );
  }, [clusteringResult.points, selectedSector, sectorColumn]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Perfil de los Segmentos de Acuerdo al Sector Económico
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Matriz de penetración, arquetipos de clientes y benchmarking sectorial para alinear la propuesta de valor.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {allSectors.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-semibold">Filtrar Sector:</span>
                <select
                  value={selectedSector}
                  onChange={e => setSelectedSector(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none"
                >
                  <option value="all">Todos los Sectores ({clusteringResult.points.length})</option>
                  {allSectors.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <span>Ver Playbook 5 Pilares</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sector Cross-Tabulation Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Matriz de Concentración: Clúster vs. Sector Económico
            </h3>
            <p className="text-xs text-slate-500">
              Distribución absoluta y porcentual de clientes dentro de cada sub-industria.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Clúster Estratégico</th>
                {allSectors.map(s => (
                  <th key={s} className="py-2.5 px-3 text-center">
                    {s}
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right">Total Segmento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {clusteringResult.centroids.map(c => {
                const totalInCluster = c.size;

                return (
                  <tr key={c.clusterIndex} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-slate-900">{c.name}</span>
                        <span className="text-[11px] text-slate-400">({c.percentage}%)</span>
                      </div>
                    </td>

                    {allSectors.map(sec => {
                      const count = clusteringResult.sectorDistribution[c.clusterIndex]?.[sec] || 0;
                      const pctOfCluster = totalInCluster > 0 ? Math.round((count / totalInCluster) * 100) : 0;
                      const isHigh = pctOfCluster >= 35;

                      return (
                        <td key={sec} className="py-3 px-3 text-center">
                          <div
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono ${
                              isHigh
                                ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-200'
                                : count > 0
                                ? 'bg-slate-100 text-slate-800 font-medium'
                                : 'text-slate-300'
                            }`}
                          >
                            <span>{count}</span>
                            {count > 0 && (
                              <span className="text-[10px] text-slate-500 ml-1">({pctOfCluster}%)</span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {totalInCluster}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Archetype Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusteringResult.strategies.map((strat) => {
          const centroid = clusteringResult.centroids[strat.clusterIndex];

          return (
            <div
              key={strat.clusterIndex}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header with color indicator */}
                <div
                  className="p-4 border-b border-slate-100 relative"
                  style={{ borderTop: `4px solid ${centroid?.color || '#3B82F6'}` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: centroid?.color || '#3B82F6' }}
                    >
                      {strat.clusterName}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {centroid?.percentage}% de la cartera ({centroid?.size} obs.)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                    {strat.archetype}
                  </h3>

                  <div className="mt-1 text-xs text-indigo-600 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>Sector Principal: <b>{strat.sectorFocus}</b></span>
                  </div>
                </div>

                {/* Summary narrative */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {strat.summary}
                  </p>
                </div>

                {/* Key Metrics Benchmarking */}
                <div className="p-4 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Métricas del Centroide vs. Promedio
                  </h4>
                  <div className="space-y-1.5">
                    {strat.keyMetrics.map(km => (
                      <div
                        key={km.label}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-slate-600 capitalize">{km.label}:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          <span>{km.value}</span>
                          <span
                            className={`text-[10px] px-1 rounded ${
                              km.trend === 'up'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {km.trend === 'up' ? '▲ Alto' : '▼ Bajo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Listo para GTM
                </span>
                <span className="font-semibold text-indigo-600">
                  5 Pilares definidos →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
