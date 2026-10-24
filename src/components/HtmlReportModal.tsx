import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Sparkles,
  Printer
} from 'lucide-react';

interface HtmlReportModalProps {
  htmlContent: string;
  datasetName: string;
  onClose: () => void;
  onExportCsv: () => void;
}

export const HtmlReportModal: React.FC<HtmlReportModalProps> = ({
  htmlContent,
  datasetName,
  onClose,
  onExportCsv
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = datasetName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Dossier_Clustering_GoToMarket_${safeName}_${dateStr}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = htmlContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Reporte Ejecutivo HTML para el Mercado
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  Autónomo &amp; Sin Dependencias
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Archivo HTML autónomo listo para enviar por email, presentar en reuniones o publicar en intranet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Incluye: Centroides euclídeos, estadísticas, reglas de negocio y los 5 pilares estratégicos.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar HTML</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Abrir en Pestaña</span>
            </button>

            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Dataset CSV</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Descargar Archivo HTML (.html)</span>
            </button>
          </div>
        </div>

        {/* Live IFrame Preview */}
        <div className="flex-1 bg-slate-200 p-2 sm:p-4 overflow-hidden">
          <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300 overflow-hidden">
            <iframe
              title="Reporte Ejecutivo HTML"
              srcDoc={htmlContent}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
