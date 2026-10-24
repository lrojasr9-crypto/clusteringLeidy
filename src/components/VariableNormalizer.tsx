import React, { useState } from 'react';
import {
  ColumnMetadata,
  NormalizationMethod,
  VariableType
} from '../types/clustering';
import {
  SlidersHorizontal,
  Table,
  Sparkles,
  HelpCircle,
  Hash,
  Tag,
  Key,
  Calendar,
  CheckSquare,
  Square,
  Building2,
  UploadCloud
} from 'lucide-react';
import { computeColumnNormParams, normalizeValue } from '../utils/normalization';

interface VariableNormalizerProps {
  columns: ColumnMetadata[];
  onUpdateColumns: (updated: ColumnMetadata[]) => void;
  normalizationMethod: NormalizationMethod;
  onUpdateNormMethod: (method: NormalizationMethod) => void;
  sectorColumn: string;
  onUpdateSectorColumn: (col: string) => void;
  idColumn: string;
  onUpdateIdColumn: (col: string) => void;
  data: Record<string, any>[];
  onNext: () => void;
  onUploadClick?: () => void;
}

export const VariableNormalizer: React.FC<VariableNormalizerProps> = ({
  columns,
  onUpdateColumns,
  normalizationMethod,
  onUpdateNormMethod,
  sectorColumn,
  onUpdateSectorColumn,
  idColumn,
  onUpdateIdColumn,
  data,
  onNext,
  onUploadClick
}) => {
  const [showNormalizedPreview, setShowNormalizedPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  const selectedFeatures = columns.filter(c => c.isFeature).map(c => c.name);

  const handleToggleFeature = (colName: string) => {
    const updated = columns.map(c => {
      if (c.name === colName) {
        return { ...c, isFeature: !c.isFeature };
      }
      return c;
    });
    onUpdateColumns(updated);
  };

  const handleSelectAllNumeric = (select: boolean) => {
    const updated = columns.map(c => {
      if (c.type === 'numeric' && c.name !== idColumn) {
        return { ...c, isFeature: select };
      }
      return c;
    });
    onUpdateColumns(updated);
  };

  const handleChangeType = (colName: string, newType: VariableType) => {
    const updated = columns.map(c => {
      if (c.name === colName) {
        const isNumeric = newType === 'numeric';
        return {
          ...c,
          type: newType,
          isFeature: isNumeric && c.name !== idColumn
        };
      }
      return c;
    });
    onUpdateColumns(updated);
  };

  // Compute normalized values for preview
  const normParamsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    selectedFeatures.forEach(f => {
      const vals = data.map(row => Number(row[f]) || 0);
      map[f] = computeColumnNormParams(vals, f);
    });
    return map;
  }, [data, selectedFeatures]);

  const getTypeIcon = (type: VariableType) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-3.5 h-3.5 text-blue-500" />;
      case 'categorical':
        return <Tag className="w-3.5 h-3.5 text-amber-500" />;
      case 'identifier':
        return <Key className="w-3.5 h-3.5 text-purple-500" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const pageSize = 8;
  const paginatedData = data.slice(previewPage * pageSize, (previewPage + 1) * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner / Configuration summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              Tipología de Variables y Normalización Automática
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Las variables en distintas unidades (ej. Facturación en miles vs Margen en %) deben normalizarse para evitar que las magnitudes elevadas dominen la distancia euclídea.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onUploadClick && (
              <button
                type="button"
                onClick={onUploadClick}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 shadow-2xs"
              >
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Subir Nueva Base de Datos</span>
              </button>
            )}

            <button
              onClick={onNext}
              disabled={selectedFeatures.length < 2}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <span>Continuar a Reglas &amp; Descriptiva</span>
              <span className="bg-blue-700/60 px-1.5 py-0.5 rounded text-[10px]">
                {selectedFeatures.length} variables
              </span>
            </button>
          </div>
        </div>

        {/* Global Mapping Controls: Sector Column & ID Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Columna de Sector Económico (Agrupación &amp; Perfilado):
            </label>
            <select
              value={sectorColumn}
              onChange={(e) => onUpdateSectorColumn(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Sin columna de sector (Multisectorial general) --</option>
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type}) {c.isSectorColumn ? '⭐ Detectada como Sector' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Se utilizará para la matriz de penetración por sector y la formulación de estrategias específicas.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-600" />
              Columna Identificador (ID de Cliente / Cuenta / Razón Social):
            </label>
            <select
              value={idColumn}
              onChange={(e) => onUpdateIdColumn(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Sin identificador específico (Usar índice de fila #1, #2...) --</option>
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type}) {c.isIdColumn ? '⭐ Detectada como ID' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Identifica a cada cliente o empresa en tablas y reportes ejecutivos.
            </p>
          </div>
        </div>
      </div>

      {/* Normalization Method Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Método de Normalización Automática
          </h3>
          <span className="text-xs text-slate-400">Distancia Euclídea sensible a escala</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => onUpdateNormMethod('minmax')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              normalizationMethod === 'minmax'
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Min-Max Scaling</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                0 a 1 (Recomendado)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Transforma cada variable a un rango entre 0 y 1. Ideal para visualizaciones de dispersión y pesos equilibrados.
            </p>
          </button>

          <button
            onClick={() => onUpdateNormMethod('zscore')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              normalizationMethod === 'zscore'
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Z-Score (Standard)</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                μ=0, σ=1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Estandarización basada en la media y desviación típica. Ideal si las variables presentan distribución normal.
            </p>
          </button>

          <button
            onClick={() => onUpdateNormMethod('robust')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              normalizationMethod === 'robust'
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Robust Scaler</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Mediana / IQR
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Resistente a valores atípicos (outliers). Utiliza la mediana y el rango intercuartílico en vez de la media.
            </p>
          </button>

          <button
            onClick={() => onUpdateNormMethod('none')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              normalizationMethod === 'none'
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Sin Normalizar</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Brutos
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Valores originales sin transformar. Útil únicamente si todas las métricas comparten la misma unidad monetaria o porcentaje.
            </p>
          </button>
        </div>
      </div>

      {/* Variables Inspection & Feature Selection Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Variables Detectadas en el Archivo ({columns.length})
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona las variables numéricas que alimentarán el modelo de clustering por distancia euclídea.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAllNumeric(true)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Seleccionar Todas Numéricas
            </button>
            <button
              onClick={() => handleSelectAllNumeric(false)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Deseleccionar Todas
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">Usar</th>
                <th className="py-2.5 px-4">Nombre de Columna</th>
                <th className="py-2.5 px-4">Tipo Asignado</th>
                <th className="py-2.5 px-4">Valores Únicos</th>
                <th className="py-2.5 px-4">Faltantes</th>
                <th className="py-2.5 px-4">Muestra de Valores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {columns.map((col) => {
                const isNumeric = col.type === 'numeric';
                const isSector = col.name === sectorColumn;
                const isId = col.name === idColumn;

                return (
                  <tr
                    key={col.name}
                    className={`hover:bg-slate-50 transition-colors ${
                      col.isFeature ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(col.name)}
                        disabled={!isNumeric || isId}
                        title={
                          !isNumeric
                            ? 'Solo variables numéricas pueden usarse en clustering por distancia'
                            : isId
                            ? 'No se recomienda usar la columna ID como variable de clustering'
                            : 'Activar/desactivar variable'
                        }
                        className="disabled:opacity-30 disabled:cursor-not-allowed text-blue-600 hover:text-blue-800"
                      >
                        {col.isFeature ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>

                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        {isSector && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-semibold">
                            Sector
                          </span>
                        )}
                        {isId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                            ID
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <select
                        value={col.type}
                        onChange={(e) => handleChangeType(col.name, e.target.value as VariableType)}
                        className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="numeric">Numérica (Continua/Discreta)</option>
                        <option value="categorical">Categórica / Texto</option>
                        <option value="identifier">Identificador único</option>
                        <option value="date">Fecha / Periodo</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 font-mono">
                      {col.uniqueValuesCount}
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      {col.missingCount > 0 ? (
                        <span className="text-amber-600 font-semibold">{col.missingCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {col.sampleValues.map(v => String(v)).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Data Preview (Raw vs Normalized) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Vista Previa de Matriz de Datos ({data.length} registros)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setShowNormalizedPreview(false)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  !showNormalizedPreview
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valores Reales
              </button>
              <button
                onClick={() => setShowNormalizedPreview(true)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  showNormalizedPreview
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valores Normalizados ({normalizationMethod.toUpperCase()})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 w-12 text-slate-400">#</th>
                {idColumn && <th className="py-2 px-3">{idColumn}</th>}
                {sectorColumn && <th className="py-2 px-3">{sectorColumn}</th>}
                {selectedFeatures.map(f => (
                  <th key={f} className="py-2 px-3 text-blue-900 font-mono">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {paginatedData.map((row, idx) => {
                const actualIndex = previewPage * pageSize + idx;
                return (
                  <tr key={actualIndex} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{actualIndex + 1}</td>
                    {idColumn && <td className="py-2 px-3 text-slate-800">{row[idColumn]}</td>}
                    {sectorColumn && (
                      <td className="py-2 px-3 text-slate-600 font-sans">{row[sectorColumn]}</td>
                    )}
                    {selectedFeatures.map(f => {
                      const rawVal = Number(row[f]) || 0;
                      let displayVal = rawVal.toLocaleString('es-ES');

                      if (showNormalizedPreview && normParamsMap[f]) {
                        const norm = normalizeValue(rawVal, normalizationMethod, normParamsMap[f]);
                        displayVal = norm.toFixed(3);
                      }

                      return (
                        <td
                          key={f}
                          className={`py-2 px-3 ${
                            showNormalizedPreview ? 'text-blue-600 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Mostrando {previewPage * pageSize + 1} a{' '}
            {Math.min((previewPage + 1) * pageSize, data.length)} de {data.length} filas
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
              disabled={previewPage === 0}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 font-medium">
              {previewPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={previewPage >= totalPages - 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
