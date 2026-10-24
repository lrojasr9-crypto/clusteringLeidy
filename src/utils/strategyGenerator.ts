import { ClusterCentroid, ClusterPoint, ClusterStrategy } from '../types/clustering';

export function generateClusterStrategies(
  centroids: ClusterCentroid[],
  points: ClusterPoint[],
  features: string[],
  sectorColumn?: string
): ClusterStrategy[] {
  // Compute global feature averages across all points to determine relative positioning
  const globalAverages: Record<string, number> = {};
  features.forEach(f => {
    const sum = points.reduce((acc, p) => acc + (Number(p.raw[f]) || 0), 0);
    globalAverages[f] = points.length > 0 ? sum / points.length : 0;
  });

  return centroids.map(centroid => {
    const clusterPoints = points.filter(p => p.cluster === centroid.clusterIndex);
    const count = clusterPoints.length;

    // Detect primary economic sector for this cluster
    const sectorCounts: Record<string, number> = {};
    if (sectorColumn) {
      clusterPoints.forEach(p => {
        const sec = p.raw[sectorColumn] ? String(p.raw[sectorColumn]) : 'General';
        sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
      });
    }
    const dominantSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Multisectorial';

    // Assess relative strengths across features
    // Check if sales/revenue is above average
    const revenueFeat = features.find(f => /venta|arr|ingreso|facturacion|saldo|gasto/i.test(f));
    const marginFeat = features.find(f => /margen|margin|ebitda|rentab/i.test(f));
    const freqFeat = features.find(f => /frecuen|transac|visita|compra/i.test(f));
    const recencyFeat = features.find(f => /recen|inactiv|dias/i.test(f));
    const ticketFeat = features.find(f => /ticket|promedio|monto/i.test(f));

    const isHighRevenue = revenueFeat
      ? centroid.originalCoords[revenueFeat] >= (globalAverages[revenueFeat] || 0)
      : centroid.percentage < 35;

    const isHighMargin = marginFeat
      ? centroid.originalCoords[marginFeat] >= (globalAverages[marginFeat] || 0)
      : true;

    const isHighFreq = freqFeat
      ? centroid.originalCoords[freqFeat] >= (globalAverages[freqFeat] || 0)
      : false;

    const isHighRecency = recencyFeat
      ? centroid.originalCoords[recencyFeat] > (globalAverages[recencyFeat] || 0) * 1.15
      : false;

    // Determine Archetype & Narrative
    let archetype = '';
    let summary = '';

    if (isHighRevenue && isHighMargin) {
      archetype = 'Cuentas Estratégicas Tier-1 (VIP Champions)';
      summary = `Segmento de máxima rentabilidad y volumen representativo (${centroid.percentage}% del total). Constituye la columna vertebral del flujo de caja. Demanda servicio premium, alta disponibilidad y personalización sin fricción.`;
    } else if (isHighFreq && !isHighRevenue) {
      archetype = 'Frecuentes Transaccionales / Crecimiento Dinámico';
      summary = `Compradores habituales con alta interacción pero ticket unitario moderado (${centroid.percentage}% del total). Gran potencial para incremento de ticket (up-selling) y fidelización omnicanal.`;
    } else if (isHighRecency) {
      archetype = 'Segmento Latente / Riesgo de Deserción (Churn)';
      summary = `Cuentas con prolongado tiempo sin actividad reciente y caída en engagement (${centroid.percentage}% del total). Requiere campañas de choque, reactivación comercial y auditoría de motivos de inactividad.`;
    } else if (isHighRevenue && !isHighMargin) {
      archetype = 'Volumen Elevado con Margen Ajustado (Compradores Negociadores)';
      summary = `Clientes con alto poder de compra pero bajo margen de contribución (${centroid.percentage}% del total). Se debe proteger la rentabilidad renegociando condiciones o redirigiendo a productos de mayor margen.`;
    } else {
      archetype = 'Segmento Oportunidad / Adopción Media';
      summary = `Grupo balanceado con comportamiento estándar (${centroid.percentage}% del total). Idóneo para programas de aceleración comercial y estandarización de servicios digitales.`;
    }

    // Key metrics tags
    const keyMetrics = features.slice(0, 4).map(f => {
      const orig = centroid.originalCoords[f];
      const avg = globalAverages[f] || 0;
      const isUp = orig >= avg;
      return {
        label: f.replace(/_/g, ' '),
        value: typeof orig === 'number' ? (orig > 999 ? orig.toLocaleString() : orig.toString()) : String(orig),
        trend: isUp ? ('up' as const) : ('down' as const)
      };
    });

    // 5-Pillar Tactical Formulation
    let prodAcciones: string[] = [];
    let precAcciones: string[] = [];
    let innovAcciones: string[] = [];
    let comunAcciones: string[] = [];
    let rentAcciones: string[] = [];

    if (archetype.includes('VIP Champions')) {
      prodAcciones = [
        'Crear catálogo exclusivo de productos premium y preventas exclusivas.',
        'Ofrecer SLAs garantizados (atención en menos de 2 horas o delivery prioritario).',
        'Empaquetar servicios de consultoría o soporte técnico dedicado sin costo adicional.'
      ];
      precAcciones = [
        'Mantener política de precios premium / value-based pricing sin guerra de descuentos.',
        'Contratos multianuales con cláusula de fidelización y bonos por cumplimiento.',
        'Estructura de cobro personalizada con líneas de crédito rotativas preferenciales.'
      ];
      innovAcciones = [
        'Integración directa vía API o EDI con los sistemas de aprovisionamiento del cliente.',
        'Portal analítico corporativo con métricas en tiempo real de su consumo.',
        'Co-creación de nuevos productos y sesiones de innovación exclusivas (Advisory Board).'
      ];
      comunAcciones = [
        'Asignación estricta de Key Account Manager (KAM) con visitas ejecutivas trimestrales.',
        'Canal VIP directo (WhatsApp corporativo o línea directa 24/7).',
        'Invitaciones a eventos ejecutivos cerrados y reconocimientos de marca conjunta.'
      ];
      rentAcciones = [
        'Monitorear Cost-to-Serve para asegurar que los servicios VIP no erosionen el margen.',
        'Ampliar el Wallet Share mediante venta cruzada de líneas de alto margen.',
        'Objetivo de Churn voluntario < 1% anual.'
      ];
    } else if (archetype.includes('Frecuentes Transaccionales')) {
      prodAcciones = [
        'Bundling de productos complementarios con umbral mínimo de compra para incentivar ticket.',
        'Formatos multipack o empaques de mayor volumen para elevar compra media.',
        'Garantía extendida o beneficios por compras recurrentes continuas.'
      ];
      precAcciones = [
        'Precios escalonados: descuentos automáticos al superar un monto umbral de facturación.',
        'Planes de suscripción o entregas programadas con 5% a 8% de beneficio en costo.',
        'Cashback acumulable canjeable únicamente en compras futuras de mayor valor.'
      ];
      innovAcciones = [
        'Algoritmos de recomendación predictiva ("frecuentemente comprado juntos") en checkout.',
        'App móvil o PWA con experiencia de compra en 1-clic y notificaciones push inteligentes.',
        'Gamificación con insignias de fidelidad y niveles de cliente con recompensas progresivas.'
      ];
      comunAcciones = [
        'Estrategia de Email Marketing & WhatsApp automatizado por disparadores de frecuencia.',
        'Campañas hiper-segmentadas de fin de semana o días de reposición.',
        'Encuestas de satisfacción transaccional instantánea (Micro-CSAT post-compra).'
      ];
      rentAcciones = [
        'Incentivar pago con medios digitales de menor comisión de pasarela.',
        'Automatizar atención para reducir costo operativo por contacto a casi cero.',
        'Elevar el ticket medio en un 15% mediante cross-sell guiado por catálogo digital.'
      ];
    } else if (archetype.includes('Riesgo de Deserción')) {
      prodAcciones = [
        'Auditoría profunda de catálogo para identificar productos con fallas o devoluciones.',
        'Reactivación con producto héroe (best-seller probado) a costo especial de reenganche.',
        'Kit de bienvenida o actualización sin costo para renovar el interés.'
      ];
      precAcciones = [
        'Cupón de rescate temporal con fecha de caducidad estricta (48-72 horas).',
        'Bonificación o descuento agresivo en el primer pedido de reactivación.',
        'Condiciones de pago flexibilizadas o período de prueba sin riesgo.'
      ];
      innovAcciones = [
        'Modelo predictivo de alerta temprana que detecte descenso en señales de uso.',
        'Flujo automatizado de "Te extrañamos" con selección dinámica del último producto visto.',
        'Formulario interactivo ultra-rápido de diagnóstico de insatisfacción.'
      ];
      comunAcciones = [
        'Contacto directo por especialista de Customer Retention (no correo genérico).',
        'Mensajes enfocados en novedades, mejoras de servicio y resolución de fricciones.',
        'Revalidación de datos de contacto de tomadores de decisión corporativos.'
      ];
      rentAcciones = [
        'Fijar un presupuesto máximo de rescate vinculado al Customer Lifetime Value proyectado.',
        'Si el cliente es estructuralmente no rentable, permitir salida ordenada (deselección).',
        'Recuperar al menos un 18% de las cuentas inactivas en un ciclo de 60 días.'
      ];
    } else {
      // General / Growth
      prodAcciones = [
        'Estandarización de portafolio hacia productos con menor tiempo de entrega.',
        'Módulos de autoservicio para configuración básica de pedidos.',
        'Cross-selling de consumibles y servicios recurrentes.'
      ];
      precAcciones = [
        'Precios transparentes en línea con tablas de descuentos visibles por volumen.',
        'Promociones estacionales enfocadas en rotación de inventario.',
        'Financiamiento estándar a 30 días contra evaluación crediticia.'
      ];
      innovAcciones = [
        'Plataforma B2B web para autogestión de cotizaciones, pedidos y facturas fiscales.',
        'Seguimiento logístico en tiempo real con alertas por SMS/WhatsApp.',
        'Catálogo interactivo con fichas técnicas y calculadoras de ROI.'
      ];
      comunAcciones = [
        'Marketing de contenidos B2B: casos de éxito por sector económico, guías y webinars.',
        'Campañas en LinkedIn / canales sectoriales dirigidas a directores de compras.',
        'Comunicaciones mensuales con reporte de novedades del sector.'
      ];
      rentAcciones = [
        'Optimización de rutas de distribución y costos logísticos consolidados.',
        'Migración de pedidos telefónicos a canales digitales para bajar Cost-to-Serve.',
        'Establecer meta de margen bruto mínimo garantizado de al menos 25%.'
      ];
    }

    return {
      clusterIndex: centroid.clusterIndex,
      clusterName: centroid.name,
      archetype,
      sectorFocus: dominantSector,
      summary,
      keyMetrics,
      producto: {
        titulo: '1. Estrategia de Portafolio de Producto & Valor',
        acciones: prodAcciones,
        kpis: ['Adopción de nuevas líneas', 'Tasa de devoluciones < 2%', 'NPS de Producto > 50']
      },
      precio: {
        titulo: '2. Estrategia de Pricing, Descuentos & Monetización',
        acciones: precAcciones,
        kpis: ['Margen bruto medio', 'Descuento promedio concedido', 'Días cartera (DSO)']
      },
      innovacion: {
        titulo: '3. Innovación, Digitalización & Tecnología',
        acciones: innovAcciones,
        kpis: ['% Transacciones autoservicio', 'Penetración de herramientas digitales', 'Velocidad de ciclo']
      },
      comunicacion: {
        titulo: '4. Estrategia de Comunicación, Canales & Go-to-Market',
        acciones: comunAcciones,
        kpis: ['Tasa de apertura/respuesta', 'CAC del segmento', 'Frecuencia de contacto óptima']
      },
      rentabilidad: {
        titulo: '5. Maximización de Rentabilidad & Retención (LTV)',
        acciones: rentAcciones,
        kpis: ['Customer Lifetime Value (LTV)', 'Tasa de Churn anual', 'Ratio LTV/CAC > 3.5x']
      }
    };
  });
}
