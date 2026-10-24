import React, { useState } from 'react';
import {
  ClusteringResult,
  ClusterStrategy
} from '../types/clustering';
import {
  Package,
  DollarSign,
  Lightbulb,
  Radio,
  TrendingUp,
  CheckCircle2,
  FileCode,
  Sparkles,
  Target,
  ArrowRight
} from 'lucide-react';

interface StrategicPlaybookProps {
  clusteringResult: ClusteringResult;
  onOpenReportModal: () => void;
}

export const StrategicPlaybook: React.FC<StrategicPlaybookProps> = ({
  clusteringResult,
  onOpenReportModal
}) => {
  const [activeClusterIndex, setActiveClusterIndex] = useState(0);

  const activeStrategy = clusteringResult.strategies[activeClusterIndex] || clusteringResult.strategies[0];
  const activeCentroid = clusteringResult.centroids[activeClusterIndex] || clusteringResult.centroids[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Estrategia Comercial Go-to-Market
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Playbook de los 5 Pilares de Negocio por Clúster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acciones tácticas e iniciativas de ejecución directa para <b>Producto, Precio, Innovación, Comunicación y Rentabilidad</b>.
            </p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0"
          >
            <FileCode className="w-4 h-4 text-white" />
            <span>Generar Reporte HTML para el Mercado</span>
          </button>
        </div>

        {/* Cluster Selection Bar */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none pb-1">
          {clusteringResult.strategies.map((strat, idx) => {
            const centroid = clusteringResult.centroids[idx];
            const isActive = activeClusterIndex === idx;

            return (
              <button
                key={strat.clusterIndex}
                onClick={() => setActiveClusterIndex(idx)}
                className={`px-4 py-2.5 rounded-xl border text-left transition-all shrink-0 flex items-center gap-3 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: centroid?.color || '#3B82F6' }}
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{strat.clusterName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({centroid?.percentage}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {strat.archetype}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cluster Overview Header Card */}
      {activeStrategy && (
        <div
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden"
          style={{ borderTop: `5px solid ${activeCentroid?.color || '#3B82F6'}` }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: activeCentroid?.color || '#3B82F6' }}
                >
                  {activeStrategy.clusterName}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {activeCentroid?.percentage}% de los clientes analizados ({activeCentroid?.size} cuentas)
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                {activeStrategy.archetype}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sector Predominante: <b className="text-slate-700">{activeStrategy.sectorFocus}</b>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              {activeStrategy.keyMetrics.map(km => (
                <div
                  key={km.label}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-center min-w-[110px]"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-semibold capitalize">
                    {km.label}
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {km.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
            <b>Diagnóstico Ejecutivo:</b> {activeStrategy.summary}
          </div>
        </div>
      )}

      {/* The 5 Pillars Tactical Grid */}
      {activeStrategy && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Producto */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Pilar 1
                </span>
                <h4 className="text-sm font-bold text-slate-800">Estrategia de Portafolio &amp; Producto</h4>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {activeStrategy.producto.acciones.map((acc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span><b>Métricas Clave:</b> {activeStrategy.producto.kpis.join(' • ')}</span>
            </div>
          </div>

          {/* Pillar 2: Precio */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Pilar 2
                </span>
                <h4 className="text-sm font-bold text-slate-800">Estrategia de Precio &amp; Monetización</h4>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {activeStrategy.precio.acciones.map((acc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><b>Métricas Clave:</b> {activeStrategy.precio.kpis.join(' • ')}</span>
            </div>
          </div>

          {/* Pillar 3: Innovación */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Pilar 3
                </span>
                <h4 className="text-sm font-bold text-slate-800">Innovación, Digitalización &amp; Tecnología</h4>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {activeStrategy.innovacion.acciones.map((acc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span><b>Métricas Clave:</b> {activeStrategy.innovacion.kpis.join(' • ')}</span>
            </div>
          </div>

          {/* Pillar 4: Comunicación */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  Pilar 4
                </span>
                <h4 className="text-sm font-bold text-slate-800">Comunicación, Canales &amp; Go-to-Market</h4>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {activeStrategy.comunicacion.acciones.map((acc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Target className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span><b>Métricas Clave:</b> {activeStrategy.comunicacion.kpis.join(' • ')}</span>
            </div>
          </div>

          {/* Pillar 5: Rentabilidad (Spans full width) */}
          <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Pilar 5 (Objetivo Financiero Central)
                </span>
                <h4 className="text-base font-bold text-emerald-950">
                  Rentabilidad, Margen Operativo &amp; Retención de Clientes (LTV)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {activeStrategy.rentabilidad.acciones.map((acc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-white/90 border border-emerald-200/80 text-xs text-slate-800 shadow-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-700" />
                <span><b>KPIs Financieros de Impacto:</b> {activeStrategy.rentabilidad.kpis.join(' • ')}</span>
              </div>
              <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                Impacto directo en P&amp;L
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer Callout */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold">¿Listo para llevar este análisis al mercado?</h4>
          <p className="text-xs text-slate-400 mt-1">
            Descarga el archivo HTML ejecutable que incluye los 5 pilares, centroides, gráficos y auditoría completa para compartir con tu comité de dirección.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/20"
        >
          <FileCode className="w-4 h-4" />
          <span>Generar &amp; Descargar Reporte HTML</span>
        </button>
      </div>
    </div>
  );
};
