import React from 'react';
import { Layers, FileCode, Download, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenReportModal: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  hasClusteringResult: boolean;
  datasetName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenReportModal,
  onExportCsv,
  onResetData,
  hasClusteringResult,
  datasetName
}) => {
  const tabs = [
    { id: 'upload', label: '📥 Subir Base de Datos (CSV/XLSX)' },
    { id: 'data', label: '1. Variables & Normalización' },
    { id: 'rules', label: '2. Reglas & Descriptiva' },
    { id: 'clustering', label: '3. Clustering & KNN' },
    { id: 'sectors', label: '4. Perfiles por Sector' },
    { id: 'playbook', label: '5. Playbook 5 Pilares' }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">ClusterPulse</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Go-to-Market Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {datasetName ? `Dataset activo: ${datasetName}` : 'Suite de Segmentación & Estrategia Comercial'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetData}
              title="Subir nueva base de datos CSV o Excel"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
            >
              <Download className="w-3.5 h-3.5 rotate-180" />
              <span>Subir Base de Datos</span>
            </button>

            {hasClusteringResult && (
              <>
                <button
                  onClick={onExportCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Descargar archivo CSV con clúster asignado a cada fila"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>

                <button
                  onClick={onOpenReportModal}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
                >
                  <FileCode className="w-4 h-4 text-white" />
                  <span>Generar Reporte HTML</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {tabs.map((tab, idx) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {hasClusteringResult && idx > 0 && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/80" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
