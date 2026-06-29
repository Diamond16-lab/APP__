import { computeMeterTotal } from '../../shared/reportUtils';

export const MESES = [
  { v: '1', l: 'Enero' },
  { v: '2', l: 'Febrero' },
  { v: '3', l: 'Marzo' },
  { v: '4', l: 'Abril' },
  { v: '5', l: 'Mayo' },
  { v: '6', l: 'Junio' },
  { v: '7', l: 'Julio' },
  { v: '8', l: 'Agosto' },
  { v: '9', l: 'Septiembre' },
  { v: '10', l: 'Octubre' },
  { v: '11', l: 'Noviembre' },
  { v: '12', l: 'Diciembre' },
];

export const DIAS = Array.from({ length: 31 }, (_, index) => index + 1);
export const ANIOS = Array.from({ length: 6 }, (_, index) => 2024 + index);

export const SECTION_TITLES = [
  'Datos del reporte',
  'Actividades',
  'Informacion del cliente',
  'Informacion tecnica',
  'Problema y solucion',
  'Partes utilizadas',
  'Checklist final',
  'Observaciones',
  'Firmas y confirmacion',
];

export function getNowParts() {
  const now = new Date();
  return {
    dia: String(now.getDate()),
    mes: String(now.getMonth() + 1),
    anio: String(now.getFullYear()),
    hora: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}

export function createInitialReportForm(user) {
  const current = getNowParts();
  return {
    taskNumber: '',
    reportTechnicalNo: '',
    employeeNumber: user?.employeeNumber || '',
    received: { ...current },
    documented: { dia: '', mes: '', anio: '', hora: '' },
    activities: {
      viaje: { dia: current.dia, mes: current.mes, anio: current.anio, inicio: '', fin: '' },
      sr1: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
      sr2: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
      sr3: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
    },
    client: {
      businessName: '',
      reportedByName: '',
      reportedByArea: '',
      address: '',
      phone: '',
      cityState: '',
    },
    equipment: {
      model: '',
      serial: '',
      system: '',
      subsystem: '',
    },
    meters: {
      bn: '',
      color: '',
    },
    technical: {
      problemReported: '',
      incompleteCall: '',
      incompleteCallReason: '',
      equipmentWorks: '',
      problemFound: '',
      faultCode: '',
      descriptionSolution: '',
    },
    parts: [
      { numParte: '', cantidad: '', fteCode: '', fteOtherText: '', folio: '' },
    ],
    checklist: {
      bandejas_rotas: { valor: '', comentario: '' },
      contacto_electrico: { valor: '', comentario: '' },
      cableado_red: { valor: '', comentario: '' },
      problema_operacion: { valor: '', comentario: '' },
      operador_capacitado: { valor: '', comentario: '' },
      falta_materiales: { valor: '', comentario: '' },
    },
    observations: {
      client: '',
      ids: '',
    },
    signatures: {
      clientName: '',
      clientDataUrl: '',
      engineerName: user?.displayName || '',
      engineerDataUrl: '',
    },
  };
}

export function syncFormWithUser(form, user) {
  return {
    ...form,
    employeeNumber: user?.employeeNumber || form.employeeNumber,
    signatures: {
      ...form.signatures,
      engineerName: user?.displayName || form.signatures.engineerName,
    },
  };
}

export function computeFormTotalMeters(form) {
  return computeMeterTotal(form.meters.bn, form.meters.color);
}

export function buildReportPayload(form) {
  return {
    taskNumber: form.taskNumber,
    reportTechnicalNo: form.reportTechnicalNo,
    employeeNumber: form.employeeNumber,
    received: form.received,
    documented: form.documented,
    activities: form.activities,
    client: form.client,
    equipment: form.equipment,
    meters: {
      ...form.meters,
      total: computeFormTotalMeters(form),
    },
    technical: form.technical,
    parts: form.parts.map((part) => ({
      ...part,
      fteDisplay: part.fteCode === 'OTRO' ? part.fteOtherText : part.fteCode,
    })),
    checklist: form.checklist,
    observations: form.observations,
    signatures: form.signatures,
  };
}

export function buildDemoForm(user) {
  const form = createInitialReportForm(user);
  const current = getNowParts();
  // Include HHmmss so each "Rellenar demo" click produces a unique folio
  // that never collides with previous demo saves in MongoDB.
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ymd = `${current.anio}${String(Number(current.mes)).padStart(2, '0')}${String(Number(current.dia)).padStart(2, '0')}`;

  return {
    ...form,
    taskNumber: 'T-2026-00847',
    reportTechnicalNo: `RT-${ymd}-DEMO-${hh}${mi}${ss}`,
    employeeNumber: user?.employeeNumber || 'IDS-072',
    received: { ...current, hora: '09:30' },
    activities: {
      viaje: { dia: current.dia, mes: current.mes, anio: current.anio, inicio: '08:00', fin: '09:15' },
      sr1: { dia: current.dia, mes: current.mes, anio: current.anio, inicio: '09:30', fin: '13:45' },
      sr2: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
      sr3: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
    },
    client: {
      businessName: 'Grupo Industrial Norteno S.A. de C.V.',
      reportedByName: 'Ing. Carlos Medina',
      reportedByArea: 'Sistemas / TI',
      address: 'Blvd. Insurgentes 4500, Col. Residencial del Norte, C.P. 21380',
      phone: '686-555-1234 Ext. 310',
      cityState: 'Mexicali, Baja California',
    },
    equipment: {
      model: 'WorkCentre 7845',
      serial: 'XRX-C7845-20240391',
      system: 'Impresion',
      subsystem: 'Modulo color',
    },
    meters: {
      bn: '148320',
      color: '54870',
    },
    technical: {
      problemReported: 'El equipo presenta atasco de papel frecuente en bandeja 2 y la impresion en color muestra rayas verticales en todas las paginas. Se reporta adicionalmente error C7-28.',
      incompleteCall: 'NO',
      incompleteCallReason: '',
      equipmentWorks: 'SI',
      problemFound: 'Rodillo de arrastre de bandeja 2 desgastado. Cartucho de toner cian con fugas internas.',
      faultCode: 'C7-28 / J2-B2',
      descriptionSolution: 'Se realizo limpieza general del modulo de alimentacion de bandeja 2. Se sustituyo rodillo de arrastre y separador. Se reemplazo cartucho de toner cian por nuevo. Se realizaron 50 impresiones de prueba en color y B&N verificando calidad optima. Equipo queda operando correctamente en todos sus modos.',
    },
    parts: [
      { numParte: '059K65820', cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-20394' },
      { numParte: '006R01700', cantidad: '1', fteCode: '02', fteOtherText: '', folio: 'F-20395' },
      { numParte: '059K47320', cantidad: '2', fteCode: 'OTRO', fteOtherText: 'LOC', folio: 'F-20396' },
    ],
    checklist: {
      bandejas_rotas: { valor: 'NO', comentario: '' },
      contacto_electrico: { valor: 'SI', comentario: '' },
      cableado_red: { valor: 'SI', comentario: '' },
      problema_operacion: { valor: 'NO', comentario: '' },
      operador_capacitado: { valor: 'SI', comentario: '' },
      falta_materiales: { valor: 'NO', comentario: '' },
    },
    observations: {
      client: 'El cliente solicita que se programe mantenimiento preventivo trimestral.',
      ids: 'Se recomienda reemplazar la unidad de imagen en la proxima visita preventiva. Contador aprox. 220,000 copias.',
    },
    signatures: {
      clientName: 'Lic. Roberto Fuentes Alvarez',
      clientDataUrl: '',
      engineerName: user?.displayName || 'Ing. Demo Tecnico',
      engineerDataUrl: '',
    },
  };
}

export function validateReportStep(step, form) {
  const missing = [];

  if (step === 1) {
    if (!form.taskNumber.trim()) missing.push('Numero de tarea');
    if (!form.reportTechnicalNo.trim()) missing.push('Numero de reporte');
    if (!form.employeeNumber.trim()) missing.push('Numero de empleado');
  }

  if (step === 2) {
    if (!form.activities.viaje.inicio) missing.push('Hora inicio de viaje');
    if (!form.activities.viaje.fin) missing.push('Hora fin de viaje');
  }

  if (step === 3) {
    if (!form.client.businessName.trim()) missing.push('Razon social');
    if (!form.client.reportedByName.trim()) missing.push('Nombre de quien reporto');
    if (!form.client.address.trim()) missing.push('Domicilio');
    if (!form.client.phone.trim()) missing.push('Telefono');
    if (!form.client.cityState.trim()) missing.push('Ciudad / Estado');
  }

  if (step === 4) {
    if (!form.equipment.model.trim()) missing.push('Modelo del equipo');
    if (!form.equipment.serial.trim()) missing.push('Serie');
  }

  if (step === 5) {
    if (!form.technical.problemReported.trim()) missing.push('Problema reportado');
    if (!form.technical.incompleteCall.trim()) missing.push('Llamada incompleta');
    if (!form.technical.equipmentWorks.trim()) missing.push('Equipo funciona');
    if (!form.technical.descriptionSolution.trim()) missing.push('Descripcion del problema / solucion');
  }

  if (step === 6) {
    form.parts.forEach((part, index) => {
      if (part.fteCode === 'OTRO' && !part.fteOtherText.trim()) {
        missing.push(`FTE personalizado en parte ${index + 1}`);
      }
    });
  }

  if (step === 7) {
    [
      ['bandejas_rotas', 'Bandejas o partes rotas'],
      ['contacto_electrico', 'Contacto electrico'],
      ['cableado_red', 'Cableado de red'],
      ['problema_operacion', 'Problema de operacion'],
      ['operador_capacitado', 'Operador capacitado'],
      ['falta_materiales', 'Falta de materiales'],
    ].forEach(([key, label]) => {
      if (!form.checklist[key].valor) missing.push(label);
    });
  }

  if (step === 9) {
    if (!form.signatures.clientName.trim()) missing.push('Nombre del cliente');
    if (!form.signatures.engineerName.trim()) missing.push('Nombre del ingeniero');
    if (!form.signatures.clientDataUrl) missing.push('Firma del cliente');
    if (!form.signatures.engineerDataUrl) missing.push('Firma del tecnico');
  }

  return missing;
}

export function validateEntireReport(form) {
  const mergedMissing = new Set();

  SECTION_TITLES.forEach((_, index) => {
    validateReportStep(index + 1, form).forEach((field) => {
      mergedMissing.add(field);
    });
  });

  return Array.from(mergedMissing);
}
