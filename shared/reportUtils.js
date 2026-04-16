function sanitizeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cleanNumericString(value) {
  const raw = sanitizeString(value);
  return raw.replace(/[^\d.-]/g, '');
}

export function createReportId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RT-${year}${month}${day}-${rand}`;
}

export function getNowParts(date = new Date()) {
  return {
    dia: String(date.getDate()),
    mes: String(date.getMonth() + 1),
    anio: String(date.getFullYear()),
    hora: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
}

export function computeMeterTotal(bn, color) {
  const bnValue = Number(cleanNumericString(bn));
  const colorValue = Number(cleanNumericString(color));
  const hasBn = Number.isFinite(bnValue);
  const hasColor = Number.isFinite(colorValue);

  if (!hasBn && !hasColor) return '';
  if (hasBn && !hasColor) return String(bnValue);
  if (!hasBn && hasColor) return String(colorValue);
  return String(bnValue + colorValue);
}

export function resolveFteDisplay(part = {}) {
  if (part.fteDisplay) return sanitizeString(part.fteDisplay);
  if (part.fteCode === 'OTRO') return sanitizeString(part.fteOtherText);
  return sanitizeString(part.fteCode);
}

export function isPartEmpty(part = {}) {
  return ![
    part.numParte,
    part.cantidad,
    part.fteCode,
    part.fteOtherText,
    part.fteDisplay,
    part.folio,
  ].some((value) => sanitizeString(value));
}

export function getReportDateParts(report) {
  const documented = report.documented ?? {};
  const received = report.received ?? {};
  const source = documented.dia && documented.mes && documented.anio ? documented : received;
  return {
    dia: sanitizeString(source.dia),
    mes: sanitizeString(source.mes),
    anio: sanitizeString(source.anio),
    hora: sanitizeString(source.hora),
  };
}

export function buildPdfPayloadFromReport(report) {
  const parts = Array.isArray(report.parts) ? report.parts : [];
  const checklist = report.checklist ?? {};

  return {
    numero_tarea: report.taskNumber,
    reporte_tecnico_no: report.reportTechnicalNo,
    nomina_rt: report.employeeNumber,
    recibida_dia: report.received?.dia ?? '',
    recibida_mes: report.received?.mes ?? '',
    recibida_anio: report.received?.anio ?? '',
    recibida_hora: report.received?.hora ?? '',
    documentada_dia: report.documented?.dia ?? '',
    documentada_mes: report.documented?.mes ?? '',
    documentada_anio: report.documented?.anio ?? '',
    documentada_hora: report.documented?.hora ?? '',
    viaje_dia: report.activities?.viaje?.dia ?? '',
    viaje_mes: report.activities?.viaje?.mes ?? '',
    viaje_anio: report.activities?.viaje?.anio ?? '',
    viaje_inicio: report.activities?.viaje?.inicio ?? '',
    viaje_fin: report.activities?.viaje?.fin ?? '',
    sr1_dia: report.activities?.sr1?.dia ?? '',
    sr1_mes: report.activities?.sr1?.mes ?? '',
    sr1_anio: report.activities?.sr1?.anio ?? '',
    sr1_inicio: report.activities?.sr1?.inicio ?? '',
    sr1_fin: report.activities?.sr1?.fin ?? '',
    sr2_dia: report.activities?.sr2?.dia ?? '',
    sr2_mes: report.activities?.sr2?.mes ?? '',
    sr2_anio: report.activities?.sr2?.anio ?? '',
    sr2_inicio: report.activities?.sr2?.inicio ?? '',
    sr2_fin: report.activities?.sr2?.fin ?? '',
    sr3_dia: report.activities?.sr3?.dia ?? '',
    sr3_mes: report.activities?.sr3?.mes ?? '',
    sr3_anio: report.activities?.sr3?.anio ?? '',
    sr3_inicio: report.activities?.sr3?.inicio ?? '',
    sr3_fin: report.activities?.sr3?.fin ?? '',
    razon_social: report.client?.businessName ?? '',
    reporto_nombre: report.client?.reportedByName ?? '',
    reporto_area: report.client?.reportedByArea ?? '',
    domicilio: report.client?.address ?? '',
    telefono: report.client?.phone ?? '',
    ciudad_edo: report.client?.cityState ?? '',
    modelo: report.equipment?.model ?? '',
    serie: report.equipment?.serial ?? '',
    medidor_bn: report.meters?.bn ?? '',
    medidor_color: report.meters?.color ?? '',
    medidor_total: report.meters?.total ?? '',
    problema_reportado: report.technical?.problemReported ?? '',
    llamada_incompleta: report.technical?.incompleteCall ?? '',
    llamada_incompleta_tipo: report.technical?.incompleteCallReason ?? '',
    equipo_funciona: report.technical?.equipmentWorks ?? '',
    problema_encontrado: report.technical?.problemFound ?? '',
    codigo_falla: report.technical?.faultCode ?? '',
    sistema: report.equipment?.system ?? '',
    subsistema: report.equipment?.subsystem ?? '',
    descripcion_problema_solucion: report.technical?.descriptionSolution ?? '',
    partes: parts.map((part) => ({
      num_parte: part.numParte ?? '',
      cant: part.cantidad ?? '',
      fte: resolveFteDisplay(part),
      folio: part.folio ?? '',
    })),
    checklist: checklist,
    obs_cliente: report.observations?.client ?? '',
    obs_ids: report.observations?.ids ?? '',
    firma_cliente: report.signatures?.clientName ?? '',
    firma_cliente_data_url: report.signatures?.clientDataUrl ?? '',
    firma_ingeniero: report.signatures?.engineerName ?? '',
    firma_ingeniero_data_url: report.signatures?.engineerDataUrl ?? '',
  };
}
