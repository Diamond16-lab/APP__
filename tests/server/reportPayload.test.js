import { describe, it, expect } from 'vitest';
import { validateReportPayload, normalizeReportPayload } from '../../server/utils/reportPayload.js';

const MOCK_USER = {
  id: 'user-001',
  username: 'admin',
  displayName: 'Ing. Demo Tecnico',
  employeeNumber: 'IDS-001',
};

function makeValidPayload(overrides = {}) {
  return {
    taskNumber: 'T-2026-001',
    reportTechnicalNo: 'RT-20260628-TEST',
    employeeNumber: 'IDS-001',
    received: { dia: '28', mes: '6', anio: '2026', hora: '09:00' },
    documented: { dia: '28', mes: '6', anio: '2026', hora: '10:00' },
    activities: {
      viaje: { dia: '28', mes: '6', anio: '2026', inicio: '08:00', fin: '09:00' },
      sr1: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
      sr2: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
      sr3: { dia: '', mes: '', anio: '', inicio: '', fin: '' },
    },
    client: {
      businessName: 'Empresa Test S.A.',
      reportedByName: 'Carlos Medina',
      reportedByArea: 'TI',
      address: 'Calle 123',
      phone: '686-555-0000',
      cityState: 'Mexicali, BC',
    },
    equipment: {
      model: 'WorkCentre 7845',
      serial: 'XRX-TEST-001',
      system: '',
      subsystem: '',
    },
    meters: { bn: '1000', color: '500' },
    technical: {
      problemReported: 'Problema de prueba',
      incompleteCall: 'NO',
      incompleteCallReason: '',
      equipmentWorks: 'SI',
      problemFound: '',
      faultCode: '',
      descriptionSolution: 'Solucion aplicada correctamente.',
    },
    parts: [
      { numParte: '059K65820', cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-001' },
    ],
    checklist: {
      bandejas_rotas: { valor: 'NO', comentario: '' },
      contacto_electrico: { valor: 'SI', comentario: '' },
      cableado_red: { valor: 'SI', comentario: '' },
      problema_operacion: { valor: 'NO', comentario: '' },
      operador_capacitado: { valor: 'SI', comentario: '' },
      falta_materiales: { valor: 'NO', comentario: '' },
    },
    observations: { client: '', ids: '' },
    signatures: {
      clientName: 'Roberto Fuentes',
      clientDataUrl: 'data:image/png;base64,abc123',
      engineerName: 'Ing. Demo Tecnico',
      engineerDataUrl: 'data:image/png;base64,def456',
    },
    ...overrides,
  };
}

describe('validateReportPayload', () => {
  it('returns no errors for a fully valid payload', () => {
    expect(validateReportPayload(makeValidPayload())).toEqual([]);
  });

  it('returns errors for all missing top-level required fields', () => {
    const errors = validateReportPayload({});
    expect(errors.some((e) => e.includes('taskNumber'))).toBe(true);
    expect(errors.some((e) => e.includes('reportTechnicalNo'))).toBe(true);
    expect(errors.some((e) => e.includes('employeeNumber'))).toBe(true);
    expect(errors.some((e) => e.includes('signatures.clientDataUrl'))).toBe(true);
    expect(errors.some((e) => e.includes('signatures.engineerDataUrl'))).toBe(true);
  });

  it('returns error for missing clientDataUrl', () => {
    const payload = makeValidPayload({ signatures: { clientName: 'X', clientDataUrl: '', engineerName: 'Y', engineerDataUrl: 'data:x' } });
    const errors = validateReportPayload(payload);
    expect(errors.some((e) => e.includes('signatures.clientDataUrl'))).toBe(true);
  });

  it('returns error for OTRO fteCode without fteOtherText', () => {
    const payload = makeValidPayload({
      parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: '', folio: '' }],
    });
    const errors = validateReportPayload(payload);
    expect(errors.some((e) => e.includes('fteOtherText'))).toBe(true);
  });

  it('does not error on OTRO when fteOtherText is provided', () => {
    const payload = makeValidPayload({
      parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: 'LOC', folio: '' }],
    });
    expect(validateReportPayload(payload)).toEqual([]);
  });

  it('skips OTRO check when the part has no fields at all (truly empty)', () => {
    // isPartEmpty returns false when fteCode is set, so OTRO is only skipped
    // when ALL fields including fteCode are blank.
    const payload = makeValidPayload({
      parts: [{ numParte: '', cantidad: '', fteCode: '', fteOtherText: '', folio: '' }],
    });
    expect(validateReportPayload(payload)).toEqual([]);
  });
});

describe('normalizeReportPayload', () => {
  it('computes meter total from bn + color', () => {
    const result = normalizeReportPayload(makeValidPayload(), MOCK_USER);
    expect(result.meters.total).toBe('1500');
  });

  it('strips empty parts', () => {
    const payload = makeValidPayload({
      parts: [
        { numParte: '059K65820', cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-001' },
        { numParte: '', cantidad: '', fteCode: '', fteOtherText: '', folio: '' },
      ],
    });
    const result = normalizeReportPayload(payload, MOCK_USER);
    expect(result.parts).toHaveLength(1);
  });

  it('resolves fteDisplay for OTRO', () => {
    const payload = makeValidPayload({
      parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: 'LOC', folio: '' }],
    });
    const result = normalizeReportPayload(payload, MOCK_USER);
    expect(result.parts[0].fteDisplay).toBe('LOC');
  });

  it('derives reportDate from documented when complete', () => {
    const payload = makeValidPayload({
      documented: { dia: '15', mes: '3', anio: '2026', hora: '14:30' },
    });
    const result = normalizeReportPayload(payload, MOCK_USER);
    expect(result.reportDate.getFullYear()).toBe(2026);
    expect(result.reportDate.getMonth()).toBe(2); // March = index 2
    expect(result.reportDate.getDate()).toBe(15);
  });

  it('falls back to received date when documented is incomplete', () => {
    const payload = makeValidPayload({
      documented: { dia: '', mes: '', anio: '', hora: '' },
      received: { dia: '10', mes: '6', anio: '2026', hora: '09:00' },
    });
    const result = normalizeReportPayload(payload, MOCK_USER);
    expect(result.reportDate.getDate()).toBe(10);
    expect(result.reportDate.getMonth()).toBe(5); // June = index 5
  });

  it('uses user.displayName as technicianName', () => {
    const result = normalizeReportPayload(makeValidPayload(), MOCK_USER);
    expect(result.technicianName).toBe(MOCK_USER.displayName);
  });

  it('attaches generatedBy with userId', () => {
    const result = normalizeReportPayload(makeValidPayload(), MOCK_USER);
    expect(result.generatedBy.userId).toBe(MOCK_USER.id);
    expect(result.generatedBy.fullName).toBe(MOCK_USER.displayName);
  });

  it('trims string fields', () => {
    const payload = makeValidPayload({
      taskNumber: '  T-2026-001  ',
    });
    const result = normalizeReportPayload(payload, MOCK_USER);
    expect(result.taskNumber).toBe('T-2026-001');
  });
});
