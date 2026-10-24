import React, { useState } from 'react';
import {
  BusinessRule,
  DescriptiveStat,
  RuleViolation
} from '../types/clustering';
import {
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Trash2,
  Filter,
  ArrowRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

interface BusinessRulesAuditProps {
  stats: DescriptiveStat[];
  rules: BusinessRule[];
  violations: RuleViolation[];
  complianceRate: number;
  onAddRule: (rule: BusinessRule) => void;
  onDeleteRule: (id: string) => void;
  onNext: () => void;
  allColumns: string[];
}

export const BusinessRulesAudit: React.FC<BusinessRulesAuditProps> = ({
  stats,
  rules,
  violations,
  complianceRate,
  onAddRule,
  onDeleteRule,
  onNext,
  allColumns
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New rule state form
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCol, setNewRuleCol] = useState(allColumns[0] || '');
  const [newRuleOp, setNewRuleOp] = useState<BusinessRule['operator']>('>');
  const [newRuleThreshold, setNewRuleThreshold] = useState<string>('0');
  const [newRuleSeverity, setNewRuleSeverity] = useState<BusinessRule['severity']>('warning');
  const [newRuleObjective, setNewRuleObjective] = useState('');

  const filteredViolations = violations.filter(v => {
    if (filterSeverity === 'all') return true;
    return v.severity === filterSeverity;
  });

  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const infoCount = violations.filter(v => v.severity === 'info').length;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRuleCol) return;

    const created: BusinessRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName,
      description: `Regla de negocio sobre ${newRuleCol} (${newRuleOp} ${newRuleThreshold})`,
      column: newRuleCol,
      operator: newRuleOp,
      threshold: isNaN(Number(newRuleThreshold)) ? newRuleThreshold : Number(newRuleThreshold),
      severity: newRuleSeverity,
      businessObjective: newRuleObjective || 'Validación de política de negocio'
    };

    onAddRule(created);
    setShowAddModal(false);
    setNewRuleName('');
    setNewRuleThreshold('0');
    setNewRuleObjective('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              Auditoría de Reglas de Negocio &amp; Análisis Descriptivo
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verificación automatizada de consistencia contable, umbrales de margen y banderas de alerta antes de segmentar.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <span>Continuar a Clustering &amp; KNN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compliance Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Tasa de Conformidad</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{complianceRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {complianceRate >= 90 ? 'Excelente calidad de datos' : 'Requiere atención'}
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                complianceRate >= 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Alertas Críticas</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{criticalCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Violaciones severas de negocio</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Advertencias</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{warningCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Umbrales límite / Churn risk</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Reglas Evaluadas</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{rules.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{infoCount} informativas</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Descriptive Statistics Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Estadísticas Descriptivas de las Variables
            </h3>
            <p className="text-xs text-slate-500">
              Tendencia central (Media, Mediana), dispersión (Desv. Estándar, IQR) y detección de valores atípicos (Outliers 1.5x IQR).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Variable</th>
                <th className="py-2.5 px-3 text-right">Media (μ)</th>
                <th className="py-2.5 px-3 text-right">Mediana</th>
                <th className="py-2.5 px-3 text-right">Desv. Est. (σ)</th>
                <th className="py-2.5 px-3 text-right">Mín</th>
                <th className="py-2.5 px-3 text-right">Máx</th>
                <th className="py-2.5 px-3 text-right">Q1 (25%)</th>
                <th className="py-2.5 px-3 text-right">Q3 (75%)</th>
                <th className="py-2.5 px-3 text-right">IQR</th>
                <th className="py-2.5 px-3 text-right">Asimetría</th>
                <th className="py-2.5 px-3 text-center">Outliers (IQR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {stats.map(s => {
                const isHighOutliers = s.outliersCount > 0;
                return (
                  <tr key={s.column} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">
                      {s.column.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      {s.mean.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {s.median.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {s.stdDev.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {s.min.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {s.max.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {s.q1.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {s.q3.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                      {s.iqr.toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={
                          Math.abs(s.skewness) > 1
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-600'
                        }
                      >
                        {s.skewness}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isHighOutliers
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.outliersCount} {s.outliersCount === 1 ? 'caso' : 'casos'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Configured & Violations Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules Configured List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Reglas de Negocio Activas ({rules.length})
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Regla</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rules.map((rule) => {
              const ruleViolations = violations.filter(v => v.ruleId === rule.id);
              const hasFails = ruleViolations.length > 0;

              return (
                <div
                  key={rule.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rule.severity === 'critical'
                              ? 'bg-rose-500'
                              : rule.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-800">{rule.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{rule.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-semibold font-mono">
                          {rule.column} {rule.operator} {rule.threshold}
                        </code>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {rule.businessObjective}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hasFails
                            ? rule.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {ruleViolations.length} {ruleViolations.length === 1 ? 'alerta' : 'alertas'}
                      </span>
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Violations Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Registro de Violaciones / Anomalías Detectadas ({violations.length})
            </h3>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas ({violations.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'critical'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                Críticas ({criticalCount})
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Avisos ({warningCount})
              </button>
            </div>
          </div>

          {filteredViolations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Sin violaciones registradas en este filtro</p>
              <p className="text-[11px] text-slate-400 mt-1">Los datos cumplen con las reglas especificadas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">ID / Fila</th>
                    <th className="py-2 px-3">Regla Incumplida</th>
                    <th className="py-2 px-3">Severidad</th>
                    <th className="py-2 px-3">Valor Real</th>
                    <th className="py-2 px-3">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredViolations.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                        {v.rowId}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700">{v.ruleName}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            v.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : v.severity === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {v.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {typeof v.actualValue === 'number'
                          ? v.actualValue.toLocaleString('es-ES')
                          : String(v.actualValue)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{v.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Configurar Nueva Regla de Negocio
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Regla:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Margen Mínimo Aceptable"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna a Evaluar:
                  </label>
                  <select
                    value={newRuleCol}
                    onChange={e => setNewRuleCol(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {allColumns.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condición / Operador:
                  </label>
                  <select
                    value={newRuleOp}
                    onChange={e => setNewRuleOp(e.target.value as BusinessRule['operator'])}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value=">">Mayor que (&gt;)</option>
                    <option value=">=">Mayor o igual (&gt;=)</option>
                    <option value="<">Menor que (&lt;)</option>
                    <option value="<=">Menor o igual (&lt;=)</option>
                    <option value="!=">Diferente de (!=)</option>
                    <option value="==">Igual a (==)</option>
                    <option value="not_empty">No vacío</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Umbral:
                  </label>
                  <input
                    type="text"
                    required
                    value={newRuleThreshold}
                    onChange={e => setNewRuleThreshold(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Severidad:
                  </label>
                  <select
                    value={newRuleSeverity}
                    onChange={e => setNewRuleSeverity(e.target.value as BusinessRule['severity'])}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="critical">Crítico (Inadmisible)</option>
                    <option value="warning">Advertencia (Alerta)</option>
                    <option value="info">Informativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objetivo de Negocio / Rationale:
                </label>
                <input
                  type="text"
                  placeholder="ej. Prevenir ventas con margen negativo o pérdida operativa"
                  value={newRuleObjective}
                  onChange={e => setNewRuleObjective(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
