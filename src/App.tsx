import React, { useState, useMemo, useEffect } from 'react';
import {
  BusinessRule,
  ClusteringResult,
  ColumnMetadata,
  DatasetPreset,
  NormalizationMethod
} from './types/clustering';
import { DATASET_PRESETS } from './utils/dataGenerators';
import { inspectColumns } from './utils/normalization';
import { calculateDescriptiveStats } from './utils/descriptiveStats';
import { evaluateBusinessRules } from './utils/businessRules';
import { runKMeans } from './utils/kmeansEngine';
import { generateExecutiveHtmlReport } from './utils/htmlReportGenerator';

import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { VariableNormalizer } from './components/VariableNormalizer';
import { BusinessRulesAudit } from './components/BusinessRulesAudit';
import { ClusteringWorkspace } from './components/ClusteringWorkspace';
import { SectorProfiles } from './components/SectorProfiles';
import { StrategicPlaybook } from './components/StrategicPlaybook';
import { HtmlReportModal } from './components/HtmlReportModal';

export default function App() {
  // Load default preset initially so the app is instantly rich & interactive
  const defaultPreset = DATASET_PRESETS[0];

  const [datasetName, setDatasetName] = useState<string>(defaultPreset.name);
  const [data, setData] = useState<Record<string, any>[]>(defaultPreset.data);
  const [columns, setColumns] = useState<ColumnMetadata[]>(() => {
    const inspected = inspectColumns(defaultPreset.data);
    return inspected.map(c => ({
      ...c,
      isFeature: defaultPreset.suggestedFeatures.includes(c.name),
      isSectorColumn: c.name === defaultPreset.sectorColumn,
      isIdColumn: c.name === defaultPreset.idColumn
    }));
  });

  const [sectorColumn, setSectorColumn] = useState<string>(defaultPreset.sectorColumn);
  const [idColumn, setIdColumn] = useState<string>(defaultPreset.idColumn);
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  const [selectedK, setSelectedK] = useState<number>(3);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>(defaultPreset.suggestedRules);

  const [currentTab, setCurrentTab] = useState<string>('data');
  const [showUploadView, setShowUploadView] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Selected features for clustering
  const selectedFeatures = useMemo(() => {
    return columns.filter(c => c.isFeature && c.type === 'numeric').map(c => c.name);
  }, [columns]);

  // Descriptive Statistics
  const descriptiveStats = useMemo(() => {
    const numericCols = columns.filter(c => c.type === 'numeric').map(c => c.name);
    return calculateDescriptiveStats(data, numericCols);
  }, [data, columns]);

  // Business Rules Evaluation
  const rulesAudit = useMemo(() => {
    return evaluateBusinessRules(data, businessRules, idColumn, sectorColumn);
  }, [data, businessRules, idColumn, sectorColumn]);

  // K-Means Clustering Result
  const clusteringResult: ClusteringResult | null = useMemo(() => {
    if (!data || data.length === 0 || selectedFeatures.length < 2) return null;
    try {
      return runKMeans(
        data,
        selectedFeatures,
        selectedK,
        normalizationMethod,
        idColumn,
        sectorColumn
      );
    } catch (err) {
      console.error('Error running K-Means:', err);
      return null;
    }
  }, [data, selectedFeatures, selectedK, normalizationMethod, idColumn, sectorColumn]);

  // Generated Executive HTML Report
  const executiveHtmlReport = useMemo(() => {
    if (!clusteringResult) return '';
    return generateExecutiveHtmlReport({
      datasetName,
      clusteringResult,
      columns,
      stats: descriptiveStats,
      rules: businessRules,
      violations: rulesAudit.violations,
      complianceRate: rulesAudit.complianceRate,
      sectorColumn
    });
  }, [datasetName, clusteringResult, columns, descriptiveStats, businessRules, rulesAudit, sectorColumn]);

  // Handle data load from file upload or preset
  const handleDataLoaded = (
    loadedData: Record<string, any>[],
    name: string,
    preset?: DatasetPreset
  ) => {
    const inspected = inspectColumns(loadedData);

    let secCol = '';
    let idCol = '';
    let rulesToUse: BusinessRule[] = [];

    if (preset) {
      secCol = preset.sectorColumn;
      idCol = preset.idColumn;
      rulesToUse = preset.suggestedRules;
      inspected.forEach(c => {
        c.isFeature = preset.suggestedFeatures.includes(c.name);
        c.isSectorColumn = c.name === secCol;
        c.isIdColumn = c.name === idCol;
      });
    } else {
      const detectedSector = inspected.find(c => c.isSectorColumn)?.name || '';
      const detectedId = inspected.find(c => c.isIdColumn)?.name || '';
      secCol = detectedSector;
      idCol = detectedId;

      // Auto-generate standard baseline rules for detected numeric columns
      const firstNum = inspected.find(c => c.type === 'numeric')?.name;
      if (firstNum) {
        rulesToUse = [
          {
            id: `rule_pos_${firstNum}`,
            name: `${firstNum.replace(/_/g, ' ')} Positiva`,
            description: `El valor de ${firstNum} debe ser estrictamente mayor a 0.`,
            column: firstNum,
            operator: '>',
            threshold: 0,
            severity: 'critical',
            businessObjective: 'Integridad básica de registros y transacciones'
          }
        ];
      }
    }

    setData(loadedData);
    setDatasetName(name);
    setColumns(inspected);
    setSectorColumn(secCol);
    setIdColumn(idCol);
    setBusinessRules(rulesToUse);
    setShowUploadView(false);
    setCurrentTab('data');
  };

  // Export CSV with cluster assignments
  const handleExportCsv = () => {
    if (!clusteringResult) return;

    const headers = [
      ...Object.keys(data[0] || {}),
      'Cluster_Asignado',
      'Nombre_Cluster',
      'Distancia_Euclidea_Centroide'
    ];

    const rows = clusteringResult.points.map(pt => {
      const orig = pt.raw;
      const c = clusteringResult.centroids[pt.cluster];
      const rowVals = Object.keys(data[0] || {}).map(k => {
        const val = orig[k];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val !== undefined && val !== null ? val : '';
      });
      return [
        ...rowVals,
        pt.cluster + 1,
        `"${c?.name || ''}"`,
        pt.distanceToCentroid
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dataset_Segmentado_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Header Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'upload') {
            setShowUploadView(true);
          } else {
            setShowUploadView(false);
          }
          setCurrentTab(tab);
        }}
        onOpenReportModal={() => setShowReportModal(true)}
        onExportCsv={handleExportCsv}
        onResetData={() => {
          setShowUploadView(true);
          setCurrentTab('upload');
        }}
        hasClusteringResult={!!clusteringResult}
        datasetName={datasetName}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'upload' || showUploadView ? (
          <FileUpload onDataLoaded={handleDataLoaded} />
        ) : (
          <>
            {currentTab === 'data' && (
              <VariableNormalizer
                columns={columns}
                onUpdateColumns={setColumns}
                normalizationMethod={normalizationMethod}
                onUpdateNormMethod={setNormalizationMethod}
                sectorColumn={sectorColumn}
                onUpdateSectorColumn={setSectorColumn}
                idColumn={idColumn}
                onUpdateIdColumn={setIdColumn}
                data={data}
                onNext={() => setCurrentTab('rules')}
                onUploadClick={() => {
                  setShowUploadView(true);
                  setCurrentTab('upload');
                }}
              />
            )}

            {currentTab === 'rules' && (
              <BusinessRulesAudit
                stats={descriptiveStats}
                rules={businessRules}
                violations={rulesAudit.violations}
                complianceRate={rulesAudit.complianceRate}
                onAddRule={(r) => setBusinessRules(prev => [...prev, r])}
                onDeleteRule={(id) => setBusinessRules(prev => prev.filter(r => r.id !== id))}
                onNext={() => setCurrentTab('clustering')}
                allColumns={columns.map(c => c.name)}
              />
            )}

            {currentTab === 'clustering' && clusteringResult && (
              <ClusteringWorkspace
                clusteringResult={clusteringResult}
                selectedK={selectedK}
                onUpdateK={setSelectedK}
                features={selectedFeatures}
                sectorColumn={sectorColumn}
                onNext={() => setCurrentTab('sectors')}
              />
            )}

            {currentTab === 'sectors' && clusteringResult && (
              <SectorProfiles
                clusteringResult={clusteringResult}
                sectorColumn={sectorColumn}
                onNext={() => setCurrentTab('playbook')}
              />
            )}

            {currentTab === 'playbook' && clusteringResult && (
              <StrategicPlaybook
                clusteringResult={clusteringResult}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Standalone HTML Executive Report Modal */}
      {showReportModal && (
        <HtmlReportModal
          htmlContent={executiveHtmlReport}
          datasetName={datasetName}
          onClose={() => setShowReportModal(false)}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
}
