import { computeMeterTotal, getNowParts, isPartEmpty, resolveFteDisplay } from '../../shared/reportUtils.js';

function trim(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function ensureDateParts(parts = {}, fallback = {}) {
  return {
    dia: trim(parts.dia || fallback.dia),
    mes: trim(parts.mes || fallback.mes),
    anio: trim(parts.anio || fallback.anio),
    hora: trim(parts.hora || fallback.hora),
    inicio: trim(parts.inicio || fallback.inicio),
    fin: trim(parts.fin || fallback.fin),
  };
}

function hasCompleteDate(parts = {}) {
  return Boolean(trim(parts.dia) && trim(parts.mes) && trim(parts.anio));
}

function toDate(parts) {
  if (!parts?.anio || !parts?.mes || !parts?.dia) return null;
  const hour = trim(parts.hora || '00:00') || '00:00';
  const [hours = '00', minutes = '00'] = hour.split(':');
  const iso = `${parts.anio}-${String(parts.mes).padStart(2, '0')}-${String(parts.dia).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateReportPayload(payload = {}) {
  const errors = [];
  const requiredFields = [
    ['taskNumber', payload.taskNumber],
    ['reportTechnicalNo', payload.reportTechnicalNo],
    ['employeeNumber', payload.employeeNumber],
    ['client.businessName', payload.client?.businessName],
    ['client.reportedByName', payload.client?.reportedByName],
    ['client.address', payload.client?.address],
    ['client.phone', payload.client?.phone],
    ['client.cityState', payload.client?.cityState],
    ['equipment.model', payload.equipment?.model],
    ['equipment.serial', payload.equipment?.serial],
    ['technical.problemReported', payload.technical?.problemReported],
    ['technical.incompleteCall', payload.technical?.incompleteCall],
    ['technical.equipmentWorks', payload.technical?.equipmentWorks],
    ['technical.descriptionSolution', payload.technical?.descriptionSolution],
    ['signatures.clientName', payload.signatures?.clientName],
    ['signatures.clientDataUrl', payload.signatures?.clientDataUrl],
    ['signatures.engineerName', payload.signatures?.engineerName],
    ['signatures.engineerDataUrl', payload.signatures?.engineerDataUrl],
  ];

  requiredFields.forEach(([field, value]) => {
    if (!trim(value)) errors.push(`Missing required field: ${field}`);
  });

  (payload.parts || []).forEach((part, index) => {
    if (isPartEmpty(part)) return;
    if (part.fteCode === 'OTRO' && !trim(part.fteOtherText)) {
      errors.push(`Part ${index + 1} requires fteOtherText when OTRO is selected.`);
    }
  });

  return errors;
}

export function normalizeReportPayload(payload, user) {
  const nowParts = getNowParts();
  const generatedAt = new Date();
  const generatedByFullName = trim(user.displayName) || trim(payload.signatures?.engineerName) || 'Tecnico';
  const generatedEmployeeNumber = trim(user.employeeNumber) || trim(payload.employeeNumber);
  const received = ensureDateParts(payload.received, nowParts);
  const documentedSource = ensureDateParts(payload.documented);
  const documented = {
    dia: documentedSource.dia,
    mes: documentedSource.mes,
    anio: documentedSource.anio,
    hora: documentedSource.hora,
  };

  const normalizedParts = (payload.parts || [])
    .filter((part) => !isPartEmpty(part))
    .map((part) => ({
      numParte: trim(part.numParte),
      cantidad: trim(part.cantidad),
      fteCode: trim(part.fteCode),
      fteOtherText: trim(part.fteOtherText),
      fteDisplay: resolveFteDisplay(part),
      folio: trim(part.folio),
    }));

  const reportDate = (
    (hasCompleteDate(documented) ? toDate(documented) : null) ||
    (hasCompleteDate(received) ? toDate(received) : null) ||
    new Date()
  );

  return {
    taskNumber: trim(payload.taskNumber),
    reportTechnicalNo: trim(payload.reportTechnicalNo),
    employeeNumber: trim(payload.employeeNumber || user.employeeNumber),
    reportDate,
    received,
    documented,
    activities: {
      viaje: ensureDateParts(payload.activities?.viaje),
      sr1: ensureDateParts(payload.activities?.sr1),
      sr2: ensureDateParts(payload.activities?.sr2),
      sr3: ensureDateParts(payload.activities?.sr3),
    },
    client: {
      businessName: trim(payload.client?.businessName),
      reportedByName: trim(payload.client?.reportedByName),
      reportedByArea: trim(payload.client?.reportedByArea),
      address: trim(payload.client?.address),
      phone: trim(payload.client?.phone),
      cityState: trim(payload.client?.cityState),
    },
    equipment: {
      model: trim(payload.equipment?.model),
      serial: trim(payload.equipment?.serial),
      system: trim(payload.equipment?.system),
      subsystem: trim(payload.equipment?.subsystem),
    },
    meters: {
      bn: trim(payload.meters?.bn),
      color: trim(payload.meters?.color),
      total: computeMeterTotal(payload.meters?.bn, payload.meters?.color),
    },
    technical: {
      problemReported: trim(payload.technical?.problemReported),
      incompleteCall: trim(payload.technical?.incompleteCall),
      incompleteCallReason: trim(payload.technical?.incompleteCallReason),
      equipmentWorks: trim(payload.technical?.equipmentWorks),
      problemFound: trim(payload.technical?.problemFound),
      faultCode: trim(payload.technical?.faultCode),
      descriptionSolution: trim(payload.technical?.descriptionSolution),
    },
    parts: normalizedParts,
    checklist: {
      bandejas_rotas: payload.checklist?.bandejas_rotas ?? { valor: '', comentario: '' },
      contacto_electrico: payload.checklist?.contacto_electrico ?? { valor: '', comentario: '' },
      cableado_red: payload.checklist?.cableado_red ?? { valor: '', comentario: '' },
      problema_operacion: payload.checklist?.problema_operacion ?? { valor: '', comentario: '' },
      operador_capacitado: payload.checklist?.operador_capacitado ?? { valor: '', comentario: '' },
      falta_materiales: payload.checklist?.falta_materiales ?? { valor: '', comentario: '' },
    },
    observations: {
      client: trim(payload.observations?.client),
      ids: trim(payload.observations?.ids),
    },
    signatures: {
      clientName: trim(payload.signatures?.clientName),
      clientDataUrl: trim(payload.signatures?.clientDataUrl),
      engineerName: trim(payload.signatures?.engineerName || user.displayName),
      engineerDataUrl: trim(payload.signatures?.engineerDataUrl),
    },
    createdByUserId: user.id,
    technicianName: generatedByFullName,
    generatedBy: {
      userId: user.id,
      fullName: generatedByFullName,
      username: trim(user.username),
      employeeNumber: generatedEmployeeNumber,
    },
    generatedAt,
  };
}

export function serializeReport(report) {
  return {
    id: report._id.toString(),
    taskNumber: report.taskNumber,
    reportTechnicalNo: report.reportTechnicalNo,
    employeeNumber: report.employeeNumber,
    reportDate: report.reportDate,
    received: report.received,
    documented: report.documented,
    activities: report.activities,
    client: report.client,
    equipment: report.equipment,
    meters: report.meters,
    technical: report.technical,
    parts: report.parts,
    checklist: report.checklist,
    observations: report.observations,
    signatures: report.signatures,
    createdByUserId: report.createdByUserId?.toString?.() ?? report.createdByUserId,
    technicianName: report.technicianName,
    generatedBy: report.generatedBy
      ? {
          userId: report.generatedBy.userId?.toString?.() ?? report.generatedBy.userId,
          fullName: report.generatedBy.fullName,
          username: report.generatedBy.username,
          employeeNumber: report.generatedBy.employeeNumber,
        }
      : null,
    generatedAt: report.generatedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
