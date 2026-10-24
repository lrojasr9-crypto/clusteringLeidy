import { ClusteringResult, ColumnMetadata, DescriptiveStat, BusinessRule, RuleViolation } from '../types/clustering';

interface GenerateHtmlReportOptions {
  datasetName: string;
  clusteringResult: ClusteringResult;
  columns: ColumnMetadata[];
  stats: DescriptiveStat[];
  rules: BusinessRule[];
  violations: RuleViolation[];
  complianceRate: number;
  sectorColumn?: string;
}

export function generateExecutiveHtmlReport(options: GenerateHtmlReportOptions): string {
  const {
    datasetName,
    clusteringResult,
    stats,
    rules,
    violations,
    complianceRate,
    sectorColumn
  } = options;

  const now = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalPoints = clusteringResult.points.length;
  const k = clusteringResult.k;
  const silhouette = clusteringResult.silhouetteScore;
  const wcss = clusteringResult.wcss;

  // Render centroids rows
  const centroidsHtml = clusteringResult.centroids.map(c => {
    const coordsList = Object.entries(c.originalCoords).map(([f, val]) => {
      const formattedVal = typeof val === 'number' ? (val > 999 ? val.toLocaleString('es-ES') : val) : val;
      return `<span class="badge-feature"><b>${f.replace(/_/g, ' ')}:</b> ${formattedVal}</span>`;
    }).join(' ');

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="width:14px; height:14px; border-radius:50%; background-color:${c.color}; display:inline-block;"></span>
            <b>${c.name}</b>
          </div>
        </td>
        <td><b>${c.size}</b> (${c.percentage}%)</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${coordsList}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render descriptive stats rows
  const statsHtml = stats.map(s => `
    <tr>
      <td><b>${s.column.replace(/_/g, ' ')}</b></td>
      <td>${s.mean.toLocaleString('es-ES')}</td>
      <td>${s.median.toLocaleString('es-ES')}</td>
      <td>${s.stdDev.toLocaleString('es-ES')}</td>
      <td>${s.min.toLocaleString('es-ES')}</td>
      <td>${s.max.toLocaleString('es-ES')}</td>
      <td>${s.iqr.toLocaleString('es-ES')}</td>
      <td><span class="${s.outliersCount > 0 ? 'badge-warning' : 'badge-success'}">${s.outliersCount}</span></td>
    </tr>
  `).join('');

  // Render business rules audit
  const rulesHtml = rules.map(r => {
    const ruleViolations = violations.filter(v => v.ruleId === r.id);
    const failRate = totalPoints > 0 ? ((ruleViolations.length / totalPoints) * 100).toFixed(1) : '0';
    return `
      <tr>
        <td>
          <b>${r.name}</b>
          <div style="font-size:12px; color:#64748B;">${r.description}</div>
        </td>
        <td><code>${r.column} ${r.operator} ${r.threshold}</code></td>
        <td><span class="badge-${r.severity}">${r.severity.toUpperCase()}</span></td>
        <td><b>${ruleViolations.length}</b> (${failRate}%)</td>
        <td style="font-size:12px;">${r.businessObjective}</td>
      </tr>
    `;
  }).join('');

  // Render sector distribution matrix
  const allSectors = Array.from(new Set(
    clusteringResult.points.map(p => sectorColumn && p.raw[sectorColumn] ? String(p.raw[sectorColumn]) : 'General')
  ));

  const sectorMatrixHeaders = allSectors.map(s => `<th>${s}</th>`).join('');
  const sectorMatrixRows = clusteringResult.centroids.map(c => {
    const secCells = allSectors.map(sec => {
      const count = clusteringResult.sectorDistribution[c.clusterIndex]?.[sec] || 0;
      const pct = c.size > 0 ? Math.round((count / c.size) * 100) : 0;
      return `<td><b>${count}</b> <span style="font-size:11px; color:#64748B;">(${pct}%)</span></td>`;
    }).join('');

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="width:12px; height:12px; border-radius:50%; background-color:${c.color}; display:inline-block;"></span>
            <b>${c.name}</b>
          </div>
        </td>
        ${secCells}
        <td><b>${c.size}</b></td>
      </tr>
    `;
  }).join('');

  // Render 5-Pillar Strategic Cards
  const strategiesHtml = clusteringResult.strategies.map(strat => {
    const centroid = clusteringResult.centroids[strat.clusterIndex];
    return `
      <div class="strategy-card" style="border-top: 4px solid ${centroid?.color || '#2563EB'};">
        <div class="strategy-header">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
            <div>
              <span class="cluster-tag" style="background-color:${centroid?.color || '#2563EB'}; color:#FFF;">${strat.clusterName}</span>
              <h3 style="margin:8px 0 4px 0; font-size:20px; color:#0F172A;">${strat.archetype}</h3>
              <div style="font-size:13px; color:#64748B;"><b>Sector Predominante:</b> ${strat.sectorFocus} | <b>Representatividad:</b> ${centroid?.percentage || 0}% de la cartera (${centroid?.size || 0} observaciones)</div>
            </div>
            <div style="text-align:right;">
              <span class="badge-roi">ROI Potencial: Alto</span>
            </div>
          </div>
          <p style="margin:12px 0; font-size:14px; line-height:1.5; color:#334155; background:#F8FAFC; padding:10px; border-radius:6px;">
            ${strat.summary}
          </p>
        </div>

        <div class="pillars-grid">
          <!-- Pillar 1: Producto -->
          <div class="pillar-box">
            <div class="pillar-title">
              <span class="pillar-num">1</span>
              <h4>Estrategia de Producto</h4>
            </div>
            <ul class="pillar-list">
              ${strat.producto.acciones.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div class="pillar-kpi"><b>KPIs:</b> ${strat.producto.kpis.join(' • ')}</div>
          </div>

          <!-- Pillar 2: Precio -->
          <div class="pillar-box">
            <div class="pillar-title">
              <span class="pillar-num">2</span>
              <h4>Estrategia de Precio</h4>
            </div>
            <ul class="pillar-list">
              ${strat.precio.acciones.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div class="pillar-kpi"><b>KPIs:</b> ${strat.precio.kpis.join(' • ')}</div>
          </div>

          <!-- Pillar 3: Innovación -->
          <div class="pillar-box">
            <div class="pillar-title">
              <span class="pillar-num">3</span>
              <h4>Innovación & Digitalización</h4>
            </div>
            <ul class="pillar-list">
              ${strat.innovacion.acciones.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div class="pillar-kpi"><b>KPIs:</b> ${strat.innovacion.kpis.join(' • ')}</div>
          </div>

          <!-- Pillar 4: Comunicación -->
          <div class="pillar-box">
            <div class="pillar-title">
              <span class="pillar-num">4</span>
              <h4>Comunicación & Canales</h4>
            </div>
            <ul class="pillar-list">
              ${strat.comunicacion.acciones.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div class="pillar-kpi"><b>KPIs:</b> ${strat.comunicacion.kpis.join(' • ')}</div>
          </div>

          <!-- Pillar 5: Rentabilidad -->
          <div class="pillar-box" style="grid-column: 1 / -1; background:#F0FDF4; border-color:#BBF7D0;">
            <div class="pillar-title" style="color:#166534;">
              <span class="pillar-num" style="background:#166534;">5</span>
              <h4>Rentabilidad & Retención de Clientes (LTV)</h4>
            </div>
            <ul class="pillar-list">
              ${strat.rentabilidad.acciones.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div class="pillar-kpi" style="color:#166534;"><b>KPIs:</b> ${strat.rentabilidad.kpis.join(' • ')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Ejecutivo de Clustering & Go-to-Market - ${datasetName}</title>
  <style>
    :root {
      --primary: #1E40AF;
      --primary-light: #EFF6FF;
      --secondary: #0F172A;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --border: #E2E8F0;
      --text-main: #1E293B;
      --text-muted: #64748B;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      padding: 30px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-card {
      background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
      color: #FFFFFF;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .header-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .header-meta {
      font-size: 14px;
      color: #94A3B8;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--secondary);
    }
    .kpi-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .section-card {
      background: var(--card-bg);
      border-radius: 12px;
      border: 1px solid var(--border);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #F1F5F9;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background-color: #F8FAFC;
      color: #475569;
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    tr:hover td {
      background-color: #F8FAFC;
    }
    .badge-feature {
      display: inline-block;
      background: #F1F5F9;
      color: #334155;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .badge-critical {
      background: #FEE2E2;
      color: #991B1B;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }
    .badge-warning {
      background: #FEF3C7;
      color: #92400E;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }
    .badge-info, .badge-success {
      background: #DCFCE7;
      color: #166534;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }
    .cluster-tag {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .badge-roi {
      background: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .strategy-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .pillar-box {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .pillar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .pillar-num {
      width: 22px;
      height: 22px;
      background: var(--primary);
      color: #FFF;
      font-size: 11px;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pillar-title h4 {
      font-size: 14px;
      color: var(--secondary);
    }
    .pillar-list {
      list-style-type: none;
      font-size: 12px;
      color: #334155;
      margin-bottom: 10px;
    }
    .pillar-list li {
      margin-bottom: 6px;
      padding-left: 14px;
      position: relative;
    }
    .pillar-list li::before {
      content: "•";
      color: var(--primary);
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    .pillar-kpi {
      font-size: 11px;
      background: #FFFFFF;
      border: 1px dashed var(--border);
      padding: 6px 8px;
      border-radius: 4px;
      color: var(--text-muted);
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      background: var(--primary);
      color: #FFFFFF;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover {
      background: #1D4ED8;
    }
    @media print {
      body {
        padding: 0;
        background: #FFFFFF;
      }
      .print-actions {
        display: none;
      }
      .section-card, .strategy-card {
        page-break-inside: avoid;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-actions">
      <button class="btn" onclick="window.print()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12 0h12v4H6v-4z"></path></svg>
        Imprimir / Guardar en PDF
      </button>
    </div>

    <div class="header-card">
      <span class="header-badge">Dossier de Segmentación Estratégica &amp; GTM</span>
      <h1 class="header-title">Plan de Ejecución de Mercado por Clusters</h1>
      <div class="header-meta">
        <span><b>Dataset:</b> ${datasetName}</span>
        <span><b>Fecha de Generación:</b> ${now}</span>
        <span><b>Algoritmo:</b> K-Means / KNN con Distancia Euclídea</span>
        <span><b>Normalización:</b> ${clusteringResult.normalizationMethod.toUpperCase()}</span>
      </div>
    </div>

    <!-- KPIs Top -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Observaciones Analizadas</div>
        <div class="kpi-value">${totalPoints.toLocaleString('es-ES')}</div>
        <div class="kpi-sub">Empresas o clientes segmentados</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Grupos Óptimos (K)</div>
        <div class="kpi-value">${k}</div>
        <div class="kpi-sub">Segmentos estratégicos definidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Silhouette Score</div>
        <div class="kpi-value">${silhouette}</div>
        <div class="kpi-sub">${silhouette >= 0.5 ? 'Excelente separación' : silhouette >= 0.25 ? 'Separación moderada/buena' : 'Estructura continua'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Reglas de Negocio</div>
        <div class="kpi-value">${complianceRate}%</div>
        <div class="kpi-sub">${violations.length} anomalías detectadas en total</div>
      </div>
    </div>

    <!-- SECCION 1: Reglas de Negocio y Auditoría Descriptiva -->
    <div class="section-card">
      <h2 class="section-title">
        <span>1. Auditoría de Reglas de Negocio y Calidad de Datos</span>
      </h2>
      <p style="font-size:13px; color:#475569; margin-bottom:14px;">
        Evaluación de consistencia contable, umbrales de margen y banderas de alerta operativa aplicadas antes de la segmentación.
      </p>
      <table>
        <thead>
          <tr>
            <th>Regla de Negocio</th>
            <th>Condición Técnica</th>
            <th>Severidad</th>
            <th>Violaciones</th>
            <th>Objetivo de Negocio</th>
          </tr>
        </thead>
        <tbody>
          ${rulesHtml}
        </tbody>
      </table>
    </div>

    <!-- SECCION 2: Estadísticas Descriptivas -->
    <div class="section-card">
      <h2 class="section-title">
        <span>2. Análisis Descriptivo de Variables Numéricas</span>
      </h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Media</th>
            <th>Mediana</th>
            <th>Desv. Estándar</th>
            <th>Mín</th>
            <th>Máx</th>
            <th>IQR</th>
            <th>Outliers (IQR)</th>
          </tr>
        </thead>
        <tbody>
          ${statsHtml}
        </tbody>
      </table>
    </div>

    <!-- SECCION 3: Centroides y Parámetros Matemáticos -->
    <div class="section-card">
      <h2 class="section-title">
        <span>3. Definición de Centroides (KNN / Distancia Euclídea)</span>
      </h2>
      <p style="font-size:13px; color:#475569; margin-bottom:14px;">
        Centroides calculados en espacio multidimensional estandarizado. Se presentan en sus <b>unidades de negocio reales denormalizadas</b>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Clúster</th>
            <th>Tamaño / Cartera</th>
            <th>Coordenadas Reales de Negocio (Centroide)</th>
          </tr>
        </thead>
        <tbody>
          ${centroidsHtml}
        </tbody>
      </table>
    </div>

    <!-- SECCION 4: Distribución por Sector Económico -->
    <div class="section-card">
      <h2 class="section-title">
        <span>4. Matriz de Penetración por Sector Económico</span>
      </h2>
      <p style="font-size:13px; color:#475569; margin-bottom:14px;">
        Cruce de cada segmento estratégico frente a los sub-sectores de la industria:
      </p>
      <table>
        <thead>
          <tr>
            <th>Clúster</th>
            ${sectorMatrixHeaders}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${sectorMatrixRows}
        </tbody>
      </table>
    </div>

    <!-- SECCION 5: 5 Pilares Estratégicos para Ejecutar y Llevar al Mercado -->
    <div class="section-card" style="background:#F8FAFC; border:none; padding:0;">
      <h2 class="section-title" style="border:none; padding:0; margin-bottom:20px; font-size:22px;">
        <span>5. Playbook Estratégico de Go-to-Market (Los 5 Pilares por Clúster)</span>
      </h2>
      ${strategiesHtml}
    </div>

    <div style="text-align:center; padding:30px 0; font-size:12px; color:#94A3B8; border-top:1px solid #E2E8F0; margin-top:40px;">
      Documento generado automáticamente por <b>ClusterPulse Analytics Suite</b> | Listo para ejecución operativa y comités de dirección comercial.
    </div>
  </div>
</body>
</html>
`;
}
