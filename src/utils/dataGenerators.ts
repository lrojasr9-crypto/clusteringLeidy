import { DatasetPreset, BusinessRule } from '../types/clustering';

export const DATASET_PRESETS: DatasetPreset[] = [
  {
    id: 'retail-b2c',
    name: 'Sector Retail, Comercio & Consumo Masivo',
    sector: 'Comercio Minorista / E-Commerce',
    description: '120 cuentas de clientes minoristas con métricas de comportamiento de compra (RFM), ticket medio, margen comercial y penetración omnicanal.',
    sectorColumn: 'Sector_Economico',
    idColumn: 'Cliente_ID',
    suggestedFeatures: ['Ventas_Anuales_USD', 'Frecuencia_Compras_Ano', 'Ticket_Promedio_USD', 'Margen_Bruto_Pct', 'Recencia_Dias', 'Canal_Digital_Pct'],
    suggestedRules: [
      {
        id: 'r1_sales_positive',
        name: 'Ventas Anuales Positivas',
        description: 'Todo cliente activo debe registrar compras mayores a cero en el ejercicio fiscal.',
        column: 'Ventas_Anuales_USD',
        operator: '>',
        threshold: 0,
        severity: 'critical',
        businessObjective: 'Integridad contable y depuración de clientes inactivos'
      },
      {
        id: 'r2_margin_range',
        name: 'Margen Comercial Saludable',
        description: 'El margen bruto no debe ser inferior al 15% para garantizar sostenibilidad operativa.',
        column: 'Margen_Bruto_Pct',
        operator: '>=',
        threshold: 15,
        severity: 'warning',
        businessObjective: 'Preservación del margen de contribución directo'
      },
      {
        id: 'r3_recency_alert',
        name: 'Alerta de Riesgo de Abandono (Churn)',
        description: 'Clientes con recencia mayor a 120 días requieren activación inmediata del equipo de fidelización.',
        column: 'Recencia_Dias',
        operator: '<=',
        threshold: 120,
        severity: 'warning',
        businessObjective: 'Reducción de tasa de deserción de clientes habituales'
      },
      {
        id: 'r4_nps_quality',
        name: 'Estándar Mínimo de Satisfacción (NPS)',
        description: 'La calificación de recomendación neta debe ser al menos 6 sobre 10.',
        column: 'Satisfaccion_NPS',
        operator: '>=',
        threshold: 6,
        severity: 'info',
        businessObjective: 'Monitoreo de calidad de servicio y retención orgánica'
      }
    ],
    data: generateRetailData()
  },
  {
    id: 'b2b-saas',
    name: 'Sector B2B SaaS, Tecnología & Servicios Industriales',
    sector: 'Tecnología & Servicios Empresariales',
    description: '110 empresas corporativas analizadas por Facturación Recurrente Anual (ARR), licencias activas, adopción de plataforma y margen neto.',
    sectorColumn: 'Sector_Economico',
    idColumn: 'Empresa_ID',
    suggestedFeatures: ['ARR_Facturacion_USD', 'Numero_Licencias', 'Uso_Activo_Mensual_Pct', 'Margen_Operativo_Pct', 'Score_Salud_Cliente', 'Expansion_Revenue_Pct'],
    suggestedRules: [
      {
        id: 'b2b_r1_health',
        name: 'Score de Salud Operativo Mínimo',
        description: 'Clientes clave no deben caer por debajo de 50 puntos de salud para prevenir churn voluntario.',
        column: 'Score_Salud_Cliente',
        operator: '>=',
        threshold: 50,
        severity: 'critical',
        businessObjective: 'Mitigación proactiva de cancelaciones de contratos anuales'
      },
      {
        id: 'b2b_r2_usage',
        name: 'Tasa de Adopción de Software',
        description: 'El porcentaje de usuarios activos al mes debe superar el 40% del total de licencias asignadas.',
        column: 'Uso_Activo_Mensual_Pct',
        operator: '>=',
        threshold: 40,
        severity: 'warning',
        businessObjective: 'Garantizar el retorno de inversión percibido por el cliente'
      },
      {
        id: 'b2b_r3_margin',
        name: 'Margen Operativo Sostenible',
        description: 'El margen operativo del servicio no puede ser menor a 20%.',
        column: 'Margen_Operativo_Pct',
        operator: '>=',
        threshold: 20,
        severity: 'warning',
        businessObjective: 'Rentabilidad unitaria de contratos de servicio'
      }
    ],
    data: generateB2BData()
  },
  {
    id: 'banca-fintech',
    name: 'Sector Banca, Crédito Pyme & Fintech',
    sector: 'Servicios Financieros & Banca',
    description: '105 clientes de banca comercial y microfinanzas con saldos promedio, tasa de mora, transaccionalidad y margen financiero.',
    sectorColumn: 'Sector_Economico',
    idColumn: 'Titular_ID',
    suggestedFeatures: ['Saldo_Promedio_USD', 'Credito_Colocado_USD', 'Transacciones_Mes', 'Score_Crediticio', 'Margen_Financiero_Pct', 'Productos_Cruzados'],
    suggestedRules: [
      {
        id: 'fin_r1_mora',
        name: 'Control Estricto de Morosidad',
        description: 'La tasa de morosidad en días o porcentaje no debe exceder el 5%.',
        column: 'Ratio_Mora_Pct',
        operator: '<=',
        threshold: 5.0,
        severity: 'critical',
        businessObjective: 'Gestión prudencial de cartera de riesgo crediticio'
      },
      {
        id: 'fin_r2_credit_score',
        name: 'Calificación Crediticia Mínima Aceptable',
        description: 'Score crediticio mínimo de 620 para acceso a ampliación de líneas comerciales.',
        column: 'Score_Crediticio',
        operator: '>=',
        threshold: 620,
        severity: 'warning',
        businessObjective: 'Originación de crédito de bajo riesgo'
      }
    ],
    data: generateFinanceData()
  }
];

function generateRetailData() {
  const sectors = ['Supermercados & Alimentos', 'Moda & Calzado', 'Electrónica & Hogar', 'Farmacia & Belleza', 'Deportes & Outdoor'];
  const rows: Record<string, any>[] = [];

  // Segment templates to generate realistic multi-cluster distributions
  // 1. High value VIPs
  for (let i = 1; i <= 30; i++) {
    rows.push({
      Cliente_ID: `CLI-${1000 + i}`,
      Sector_Economico: sectors[i % sectors.length],
      Ventas_Anuales_USD: Math.round(18000 + Math.random() * 22000),
      Frecuencia_Compras_Ano: Math.round(35 + Math.random() * 45),
      Ticket_Promedio_USD: Math.round(380 + Math.random() * 320),
      Margen_Bruto_Pct: +(38 + Math.random() * 18).toFixed(1),
      Recencia_Dias: Math.round(4 + Math.random() * 25),
      Satisfaccion_NPS: Math.round(8 + Math.random() * 2),
      Tasa_Devolucion_Pct: +(1.5 + Math.random() * 3.5).toFixed(1),
      Canal_Digital_Pct: Math.round(55 + Math.random() * 40)
    });
  }

  // 2. High volume, lower margin, frequent bargain hunters
  for (let i = 31; i <= 65; i++) {
    rows.push({
      Cliente_ID: `CLI-${1000 + i}`,
      Sector_Economico: sectors[i % sectors.length],
      Ventas_Anuales_USD: Math.round(6000 + Math.random() * 7000),
      Frecuencia_Compras_Ano: Math.round(24 + Math.random() * 28),
      Ticket_Promedio_USD: Math.round(90 + Math.random() * 85),
      Margen_Bruto_Pct: +(14 + Math.random() * 12).toFixed(1), // some border rule violation
      Recencia_Dias: Math.round(15 + Math.random() * 45),
      Satisfaccion_NPS: Math.round(6 + Math.random() * 3),
      Tasa_Devolucion_Pct: +(3.0 + Math.random() * 4.0).toFixed(1),
      Canal_Digital_Pct: Math.round(25 + Math.random() * 50)
    });
  }

  // 3. Ocassional high-ticket buyers
  for (let i = 66; i <= 95; i++) {
    rows.push({
      Cliente_ID: `CLI-${1000 + i}`,
      Sector_Economico: sectors[i % sectors.length],
      Ventas_Anuales_USD: Math.round(8500 + Math.random() * 9500),
      Frecuencia_Compras_Ano: Math.round(4 + Math.random() * 7),
      Ticket_Promedio_USD: Math.round(1200 + Math.random() * 900),
      Margen_Bruto_Pct: +(42 + Math.random() * 16).toFixed(1),
      Recencia_Dias: Math.round(60 + Math.random() * 120),
      Satisfaccion_NPS: Math.round(7 + Math.random() * 3),
      Tasa_Devolucion_Pct: +(2.0 + Math.random() * 5.0).toFixed(1),
      Canal_Digital_Pct: Math.round(40 + Math.random() * 45)
    });
  }

  // 4. Inactive or churn risk / low ticket
  for (let i = 96; i <= 120; i++) {
    rows.push({
      Cliente_ID: `CLI-${1000 + i}`,
      Sector_Economico: sectors[i % sectors.length],
      Ventas_Anuales_USD: Math.round(800 + Math.random() * 2500),
      Frecuencia_Compras_Ano: Math.round(1 + Math.random() * 4),
      Ticket_Promedio_USD: Math.round(50 + Math.random() * 120),
      Margen_Bruto_Pct: +(18 + Math.random() * 15).toFixed(1),
      Recencia_Dias: Math.round(130 + Math.random() * 220), // violates rule 3 (churn)
      Satisfaccion_NPS: Math.round(4 + Math.random() * 4), // some violate rule 4
      Tasa_Devolucion_Pct: +(4.0 + Math.random() * 7.0).toFixed(1),
      Canal_Digital_Pct: Math.round(10 + Math.random() * 30)
    });
  }

  return rows;
}

function generateB2BData() {
  const sectors = ['Software & Cloud', 'Servicios Financieros', 'Manufactura Industrial', 'Logística & Cadena', 'Consultoría Estratégica'];
  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= 110; i++) {
    const isEnterprise = i <= 35;
    const isMidMarket = i > 35 && i <= 80;

    if (isEnterprise) {
      rows.push({
        Empresa_ID: `CORP-${500 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        ARR_Facturacion_USD: Math.round(120000 + Math.random() * 250000),
        Numero_Licencias: Math.round(180 + Math.random() * 320),
        Uso_Activo_Mensual_Pct: +(75 + Math.random() * 22).toFixed(1),
        Margen_Operativo_Pct: +(45 + Math.random() * 20).toFixed(1),
        Score_Salud_Cliente: Math.round(82 + Math.random() * 16),
        Tickets_Soporte_Ano: Math.round(12 + Math.random() * 25),
        Tiempo_Respuesta_Min: Math.round(8 + Math.random() * 15),
        Expansion_Revenue_Pct: +(18 + Math.random() * 32).toFixed(1)
      });
    } else if (isMidMarket) {
      rows.push({
        Empresa_ID: `CORP-${500 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        ARR_Facturacion_USD: Math.round(35000 + Math.random() * 65000),
        Numero_Licencias: Math.round(40 + Math.random() * 90),
        Uso_Activo_Mensual_Pct: +(55 + Math.random() * 30).toFixed(1),
        Margen_Operativo_Pct: +(28 + Math.random() * 18).toFixed(1),
        Score_Salud_Cliente: Math.round(60 + Math.random() * 25),
        Tickets_Soporte_Ano: Math.round(20 + Math.random() * 35),
        Tiempo_Respuesta_Min: Math.round(20 + Math.random() * 30),
        Expansion_Revenue_Pct: +(5 + Math.random() * 18).toFixed(1)
      });
    } else {
      // Small or struggling
      rows.push({
        Empresa_ID: `CORP-${500 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        ARR_Facturacion_USD: Math.round(8000 + Math.random() * 18000),
        Numero_Licencias: Math.round(5 + Math.random() * 20),
        Uso_Activo_Mensual_Pct: +(22 + Math.random() * 28).toFixed(1), // some violate rule
        Margen_Operativo_Pct: +(14 + Math.random() * 16).toFixed(1), // some violate rule
        Score_Salud_Cliente: Math.round(32 + Math.random() * 28), // some violate rule
        Tickets_Soporte_Ano: Math.round(35 + Math.random() * 40),
        Tiempo_Respuesta_Min: Math.round(45 + Math.random() * 60),
        Expansion_Revenue_Pct: +(-5 + Math.random() * 10).toFixed(1)
      });
    }
  }

  return rows;
}

function generateFinanceData() {
  const sectors = ['Pymes Comerciales', 'Microempresas', 'Corporativo / Agro', 'Profesionales & Servicios'];
  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= 105; i++) {
    const isTop = i <= 30;
    const isMid = i > 30 && i <= 75;

    if (isTop) {
      rows.push({
        Titular_ID: `BNK-${2000 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        Saldo_Promedio_USD: Math.round(85000 + Math.random() * 120000),
        Credito_Colocado_USD: Math.round(150000 + Math.random() * 300000),
        Transacciones_Mes: Math.round(180 + Math.random() * 300),
        Score_Crediticio: Math.round(760 + Math.random() * 85),
        Ratio_Mora_Pct: +(0.2 + Math.random() * 1.5).toFixed(2),
        Margen_Financiero_Pct: +(6.5 + Math.random() * 3.5).toFixed(2),
        Productos_Cruzados: Math.round(4 + Math.random() * 4)
      });
    } else if (isMid) {
      rows.push({
        Titular_ID: `BNK-${2000 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        Saldo_Promedio_USD: Math.round(18000 + Math.random() * 35000),
        Credito_Colocado_USD: Math.round(40000 + Math.random() * 80000),
        Transacciones_Mes: Math.round(50 + Math.random() * 90),
        Score_Crediticio: Math.round(660 + Math.random() * 70),
        Ratio_Mora_Pct: +(1.5 + Math.random() * 3.0).toFixed(2),
        Margen_Financiero_Pct: +(8.0 + Math.random() * 4.0).toFixed(2),
        Productos_Cruzados: Math.round(2 + Math.random() * 3)
      });
    } else {
      rows.push({
        Titular_ID: `BNK-${2000 + i}`,
        Sector_Economico: sectors[i % sectors.length],
        Saldo_Promedio_USD: Math.round(3000 + Math.random() * 9000),
        Credito_Colocado_USD: Math.round(10000 + Math.random() * 25000),
        Transacciones_Mes: Math.round(15 + Math.random() * 35),
        Score_Crediticio: Math.round(560 + Math.random() * 80), // some violate rule
        Ratio_Mora_Pct: +(4.2 + Math.random() * 5.8).toFixed(2), // some violate rule
        Margen_Financiero_Pct: +(11.0 + Math.random() * 6.0).toFixed(2),
        Productos_Cruzados: Math.round(1 + Math.random() * 1.5)
      });
    }
  }

  return rows;
}
