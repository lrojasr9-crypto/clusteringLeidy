import { BusinessRule, RuleViolation } from '../types/clustering';

export function evaluateBusinessRules(
  data: Record<string, any>[],
  rules: BusinessRule[],
  idColumn?: string,
  sectorColumn?: string
): {
  violations: RuleViolation[];
  complianceRate: number;
  violationsByRule: Record<string, number>;
  violationsBySeverity: { critical: number; warning: number; info: number };
  violationsBySector: Record<string, number>;
  compliantRowsCount: number;
} {
  const violations: RuleViolation[] = [];
  const violationsByRule: Record<string, number> = {};
  const violationsBySector: Record<string, number> = {};
  const violationsBySeverity = { critical: 0, warning: 0, info: 0 };
  const failingRowIndices = new Set<number>();

  rules.forEach(r => {
    violationsByRule[r.id] = 0;
  });

  data.forEach((row, rowIndex) => {
    const rowId = idColumn && row[idColumn] !== undefined ? row[idColumn] : `#${rowIndex + 1}`;
    const sector = sectorColumn && row[sectorColumn] !== undefined ? String(row[sectorColumn]) : 'General';

    rules.forEach(rule => {
      const rawVal = row[rule.column];
      let val = rawVal;
      if (typeof val === 'string') {
        const cleaned = val.trim().replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '');
        const n = Number(cleaned);
        if (!isNaN(n)) val = n;
      }

      let isViolated = false;
      let reason = '';

      if (val === undefined || val === null || val === '') {
        if (rule.operator === 'not_empty') {
          isViolated = true;
          reason = `El campo no puede estar vacío`;
        }
      } else {
        const thresholdNum = typeof rule.threshold === 'number' ? rule.threshold : Number(rule.threshold);
        const isNumericComparison = !isNaN(thresholdNum) && typeof val === 'number';

        switch (rule.operator) {
          case '>':
            if (isNumericComparison && !(val > thresholdNum)) {
              isViolated = true;
              reason = `Valor ${val} no es mayor a ${thresholdNum}`;
            }
            break;
          case '<':
            if (isNumericComparison && !(val < thresholdNum)) {
              isViolated = true;
              reason = `Valor ${val} no es menor a ${thresholdNum}`;
            }
            break;
          case '>=':
            if (isNumericComparison && !(val >= thresholdNum)) {
              isViolated = true;
              reason = `Valor ${val} es menor al umbral mínimo de ${thresholdNum}`;
            }
            break;
          case '<=':
            if (isNumericComparison && !(val <= thresholdNum)) {
              isViolated = true;
              reason = `Valor ${val} excede el límite máximo de ${thresholdNum}`;
            }
            break;
          case '==':
            if (String(val).toLowerCase() !== String(rule.threshold).toLowerCase()) {
              isViolated = true;
              reason = `Valor ${val} no coincide con ${rule.threshold}`;
            }
            break;
          case '!=':
            if (String(val).toLowerCase() === String(rule.threshold).toLowerCase()) {
              isViolated = true;
              reason = `Valor ${val} no debe ser igual a ${rule.threshold}`;
            }
            break;
          case 'between':
            if (rule.thresholdMax !== undefined && isNumericComparison) {
              if (val < thresholdNum || val > rule.thresholdMax) {
                isViolated = true;
                reason = `Valor ${val} fuera del rango [${thresholdNum}, ${rule.thresholdMax}]`;
              }
            }
            break;
          case 'not_empty':
            if (val === undefined || val === null || val === '') {
              isViolated = true;
              reason = `El campo requerido está vacío`;
            }
            break;
        }
      }

      if (isViolated) {
        failingRowIndices.add(rowIndex);
        violationsByRule[rule.id] = (violationsByRule[rule.id] || 0) + 1;
        violationsBySeverity[rule.severity]++;
        violationsBySector[sector] = (violationsBySector[sector] || 0) + 1;

        violations.push({
          rowIndex,
          rowId,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          column: rule.column,
          actualValue: rawVal,
          message: reason
        });
      }
    });
  });

  const totalRows = data.length;
  const compliantRowsCount = totalRows - failingRowIndices.size;
  const complianceRate = totalRows > 0 ? +((compliantRowsCount / totalRows) * 100).toFixed(1) : 100;

  return {
    violations,
    complianceRate,
    violationsByRule,
    violationsBySeverity,
    violationsBySector,
    compliantRowsCount
  };
}
