import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Database,
  Check,
  FileText,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DATASET_PRESETS } from '../utils/dataGenerators';
import { DatasetPreset } from '../types/clustering';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, any>[], filename: string, preset?: DatasetPreset) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ filename: string; rows: number; cols: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste raw CSV text modal / drawer state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Sanitize numeric fields that might use Spanish comma decimals like "1250,45"
  const sanitizeRowValues = (row: Record<string, any>): Record<string, any> => {
    const clean: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      const val = row[key];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Check if string is a number with comma decimal e.g. "123,45" or "-5,6"
        if (/^-?\d+,\d+$/.test(trimmed)) {
          const num = parseFloat(trimmed.replace(',', '.'));
          clean[key] = isNaN(num) ? trimmed : num;
        } else {
          clean[key] = trimmed;
        }
      } else {
        clean[key] = val;
      }
    });
    return clean;
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setSuccessInfo(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv' || extension === 'txt') {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: 'greedy',
          delimitersToGuess: [',', ';', '\t', '|'],
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const cleanData = (results.data as Record<string, any>[])
                .filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ''))
                .map(sanitizeRowValues);

              if (cleanData.length === 0) {
                setIsLoading(false);
                setError('El archivo CSV no contiene registros válidos.');
                return;
              }

              const colsCount = Object.keys(cleanData[0] || {}).length;
              setIsLoading(false);
              setSuccessInfo({ filename: file.name, rows: cleanData.length, cols: colsCount });
              setTimeout(() => {
                onDataLoaded(cleanData, file.name);
              }, 400);
            } else {
              setIsLoading(false);
              setError('El archivo CSV está vacío o no contiene encabezados legibles.');
            }
          },
          error: (err) => {
            setIsLoading(false);
            setError(`Error al leer el archivo CSV: ${err.message}`);
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result;
            const workbook = XLSX.read(buffer, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

            if (rawJson && rawJson.length > 0) {
              const cleanData = rawJson
                .filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ''))
                .map(sanitizeRowValues);

              const colsCount = Object.keys(cleanData[0] || {}).length;
              setIsLoading(false);
              setSuccessInfo({ filename: file.name, rows: cleanData.length, cols: colsCount });
              setTimeout(() => {
                onDataLoaded(cleanData, file.name);
              }, 400);
            } else {
              setIsLoading(false);
              setError('La hoja de cálculo de Excel no contiene filas o datos legibles.');
            }
          } catch (readErr: any) {
            setIsLoading(false);
            setError(`Error al procesar el archivo Excel: ${readErr.message}`);
          }
        };
        reader.readAsBinaryString(file);
      } else {
        setIsLoading(false);
        setError('Formato no compatible. Por favor sube un archivo con extensión .CSV o .XLSX / .XLS.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(`Error inesperado al cargar el archivo: ${err.message}`);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    setError(null);
    setIsLoading(true);

    Papa.parse(pastedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      delimitersToGuess: [',', ';', '\t', '|'],
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const cleanData = (results.data as Record<string, any>[])
            .filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ''))
            .map(sanitizeRowValues);

          if (cleanData.length === 0) {
            setIsLoading(false);
            setError('El texto pegado no tiene un formato tabular reconocible.');
            return;
          }

          setIsLoading(false);
          setShowPasteModal(false);
          onDataLoaded(cleanData, 'datos_pegados.csv');
        } else {
          setIsLoading(false);
          setError('No se pudieron extraer datos del texto pegado.');
        }
      },
      error: (err: any) => {
        setIsLoading(false);
        setError(`Error al interpretar el texto: ${err?.message || String(err)}`);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: DatasetPreset) => {
    onDataLoaded(preset.data, preset.name, preset);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Carga &amp; Procesamiento de Datos
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Subir Base de Datos para Análisis de Clustering
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Importa tu archivo <b>CSV</b> o <b>Excel (.xlsx, .xls)</b> con la información de tus clientes, empresas o productos. La aplicación normalizará automáticamente las variables, verificará reglas de negocio y calculará los centroides de clustering.
          </p>
        </div>
      </div>

      {/* Upload Zone & Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Dropzone */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[320px] bg-white shadow-sm flex-1 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[0.99] ring-4 ring-blue-500/20'
                : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFile(e.target.files[0]);
                }
              }}
              accept=".csv, .xlsx, .xls, .txt"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">
              {isLoading ? 'Leyendo y validando base de datos...' : 'Arrastra tu archivo CSV o Excel aquí'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5">
              Soporta archivos <b>.CSV, .XLSX o .XLS</b> con separadores por coma (,), punto y coma (;) o tabulaciones.
            </p>

            {/* Click to select button */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Explorar Archivos en tu Computador</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Pegar Texto CSV</span>
              </button>
            </div>

            {/* Success confirmation */}
            {successInfo && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <b>{successInfo.filename}</b> cargado con éxito ({successInfo.rows} filas, {successInfo.cols} columnas). Abriendo configuración...
                </span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl max-w-md flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preset Datasets Side Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm">O usa una Base de Datos Empresarial de Prueba</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              ¿No tienes un archivo a mano? Puedes probar el análisis de clustering y los 5 pilares con estos conjuntos de datos reales:
            </p>

            <div className="space-y-3">
              {DATASET_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all group relative flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {preset.name}
                      </h4>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {preset.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span className="text-slate-600 font-semibold">{preset.data.length} registros</span>
                      <span>•</span>
                      <span>{preset.suggestedFeatures.length} métricas</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Seguridad: Todo el procesamiento se realiza en el cliente en tu navegador.</span>
          </div>
        </div>
      </div>

      {/* Paste CSV Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Pegar Datos Tabulares (CSV / Texto)
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pega directamente tus datos separados por coma, punto y coma o tabulaciones (incluyendo la fila de encabezados):
            </p>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Cliente_ID,Sector_Economico,Ventas_USD,Margen_Pct&#10;CLI-101,Retail,15000,32.5&#10;CLI-102,Banca,24000,45.0"
              className="w-full font-mono text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
              >
                Cargar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
