import { describe, it, expect } from 'vitest';
import {
  validateReportStep,
  validateEntireReport,
  buildReportPayload,
  buildDemoForm,
  createInitialReportForm,
  computeFormTotalMeters,
} from '../../src/lib/reportForm.js';

const MOCK_USER = {
  id: 'user-001',
  username: 'admin',
  displayName: 'Ing. Demo Tecnico',
  employeeNumber: 'IDS-001',
};

function makeValidForm() {
  const base = createInitialReportForm(MOCK_USER);
  return {
    ...base,
    taskNumber: 'T-2026-001',
    reportTechnicalNo: 'RT-20260628-TEST',
    employeeNumber: 'IDS-001',
    received: { dia: '28', mes: '6', anio: '2026', hora: '09:00' },
    documented: { dia: '28', mes: '6', anio: '2026', hora: '10:00' },
    activities: {
      viaje: { dia: '28', mes: '6', anio: '2026', inicio: '08:00', fin: '09:00' },
      sr1: { dia: '28', mes: '6', anio: '2026', inicio: '09:00', fin: '13:00' },
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
      system: 'Impresion',
      subsystem: 'Modulo color',
    },
    meters: { bn: '1000', color: '500' },
    technical: {
      problemReported: 'Problema de prueba',
      incompleteCall: 'NO',
      incompleteCallReason: '',
      equipmentWorks: 'SI',
      problemFound: 'Encontrado',
      faultCode: '',
      descriptionSolution: 'Se realizo la solucion de prueba exitosamente.',
    },
    parts: [{ numParte: '059K65820', cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-001' }],
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
      clientDataUrl: 'data:image/png;base64,abc',
      engineerName: 'Ing. Demo Tecnico',
      engineerDataUrl: 'data:image/png;base64,def',
    },
  };
}

describe('validateReportStep', () => {
  describe('step 1 — Datos del reporte', () => {
    it('returns errors for all missing required fields', () => {
      const form = createInitialReportForm(null);
      const errors = validateReportStep(1, form);
      expect(errors).toContain('Numero de tarea');
      expect(errors).toContain('Numero de reporte');
      expect(errors).toContain('Numero de empleado');
    });

    it('returns empty when all step-1 fields are filled', () => {
      const form = makeValidForm();
      expect(validateReportStep(1, form)).toEqual([]);
    });
  });

  describe('step 2 — Actividades', () => {
    it('requires viaje inicio and fin', () => {
      const form = { ...makeValidForm(), activities: { ...makeValidForm().activities, viaje: { dia: '', mes: '', anio: '', inicio: '', fin: '' } } };
      const errors = validateReportStep(2, form);
      expect(errors).toContain('Hora inicio de viaje');
      expect(errors).toContain('Hora fin de viaje');
    });

    it('passes when viaje hours are filled', () => {
      expect(validateReportStep(2, makeValidForm())).toEqual([]);
    });
  });

  describe('step 3 — Cliente', () => {
    it('flags missing businessName, reportedByName, address, phone, cityState', () => {
      const form = { ...makeValidForm(), client: { businessName: '', reportedByName: '', reportedByArea: '', address: '', phone: '', cityState: '' } };
      const errors = validateReportStep(3, form);
      expect(errors).toContain('Razon social');
      expect(errors).toContain('Nombre de quien reporto');
      expect(errors).toContain('Domicilio');
      expect(errors).toContain('Telefono');
      expect(errors).toContain('Ciudad / Estado');
    });

    it('does not require reportedByArea', () => {
      const form = { ...makeValidForm(), client: { ...makeValidForm().client, reportedByArea: '' } };
      expect(validateReportStep(3, form)).toEqual([]);
    });
  });

  describe('step 4 — Equipo', () => {
    it('requires model and serial', () => {
      const form = { ...makeValidForm(), equipment: { model: '', serial: '', system: '', subsystem: '' } };
      const errors = validateReportStep(4, form);
      expect(errors).toContain('Modelo del equipo');
      expect(errors).toContain('Serie');
    });
  });

  describe('step 5 — Tecnico', () => {
    it('requires problemReported, incompleteCall, equipmentWorks, descriptionSolution', () => {
      const form = { ...makeValidForm(), technical: { problemReported: '', incompleteCall: '', incompleteCallReason: '', equipmentWorks: '', problemFound: '', faultCode: '', descriptionSolution: '' } };
      const errors = validateReportStep(5, form);
      expect(errors).toContain('Problema reportado');
      expect(errors).toContain('Llamada incompleta');
      expect(errors).toContain('Equipo funciona');
      expect(errors).toContain('Descripcion del problema / solucion');
    });
  });

  describe('step 6 — Partes', () => {
    it('flags OTRO fteCode without fteOtherText', () => {
      const form = { ...makeValidForm(), parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: '', folio: '' }] };
      const errors = validateReportStep(6, form);
      expect(errors).toContain('FTE personalizado en parte 1');
    });

    it('passes when OTRO has fteOtherText', () => {
      const form = { ...makeValidForm(), parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: 'LOC', folio: '' }] };
      expect(validateReportStep(6, form)).toEqual([]);
    });

    it('passes with empty parts list', () => {
      const form = { ...makeValidForm(), parts: [] };
      expect(validateReportStep(6, form)).toEqual([]);
    });
  });

  describe('step 7 — Checklist', () => {
    it('requires all six checklist items', () => {
      const base = makeValidForm();
      const form = {
        ...base,
        checklist: {
          bandejas_rotas: { valor: '', comentario: '' },
          contacto_electrico: { valor: '', comentario: '' },
          cableado_red: { valor: '', comentario: '' },
          problema_operacion: { valor: '', comentario: '' },
          operador_capacitado: { valor: '', comentario: '' },
          falta_materiales: { valor: '', comentario: '' },
        },
      };
      const errors = validateReportStep(7, form);
      expect(errors).toHaveLength(6);
    });

    it('passes when all checklist values are set', () => {
      expect(validateReportStep(7, makeValidForm())).toEqual([]);
    });
  });

  describe('step 9 — Firmas', () => {
    it('requires clientName, engineerName, and both dataUrls', () => {
      const form = { ...makeValidForm(), signatures: { clientName: '', clientDataUrl: '', engineerName: '', engineerDataUrl: '' } };
      const errors = validateReportStep(9, form);
      expect(errors).toContain('Nombre del cliente');
      expect(errors).toContain('Nombre del ingeniero');
      expect(errors).toContain('Firma del cliente');
      expect(errors).toContain('Firma del tecnico');
    });

    it('passes with all signature fields filled', () => {
      expect(validateReportStep(9, makeValidForm())).toEqual([]);
    });
  });
});

describe('validateEntireReport', () => {
  it('returns all missing fields across all steps', () => {
    const form = createInitialReportForm(null);
    const errors = validateEntireReport(form);
    expect(errors.length).toBeGreaterThan(5);
    expect(errors).toContain('Numero de tarea');
    expect(errors).toContain('Razon social');
    expect(errors).toContain('Firma del cliente');
  });

  it('returns empty array for a fully valid form', () => {
    expect(validateEntireReport(makeValidForm())).toEqual([]);
  });

  it('does not produce duplicate error messages', () => {
    const form = createInitialReportForm(null);
    const errors = validateEntireReport(form);
    const unique = new Set(errors);
    expect(unique.size).toBe(errors.length);
  });
});

describe('buildReportPayload', () => {
  it('computes meter total automatically', () => {
    const form = { ...makeValidForm(), meters: { bn: '1000', color: '500' } };
    const payload = buildReportPayload(form);
    expect(payload.meters.total).toBe('1500');
  });

  it('carries empty total when meters are blank', () => {
    const form = { ...makeValidForm(), meters: { bn: '', color: '' } };
    const payload = buildReportPayload(form);
    expect(payload.meters.total).toBe('');
  });

  it('resolves fteDisplay for OTRO parts', () => {
    const form = { ...makeValidForm(), parts: [{ numParte: 'X', cantidad: '1', fteCode: 'OTRO', fteOtherText: 'LOC', folio: '' }] };
    const payload = buildReportPayload(form);
    expect(payload.parts[0].fteDisplay).toBe('LOC');
  });

  it('resolves fteDisplay for standard code', () => {
    const form = { ...makeValidForm(), parts: [{ numParte: 'X', cantidad: '1', fteCode: '06', fteOtherText: '', folio: '' }] };
    const payload = buildReportPayload(form);
    expect(payload.parts[0].fteDisplay).toBe('06');
  });

  it('includes all top-level fields required by the API', () => {
    const payload = buildReportPayload(makeValidForm());
    const requiredKeys = ['taskNumber', 'reportTechnicalNo', 'employeeNumber', 'client', 'equipment', 'meters', 'technical', 'parts', 'checklist', 'observations', 'signatures'];
    for (const key of requiredKeys) {
      expect(payload).toHaveProperty(key);
    }
  });
});

describe('buildDemoForm', () => {
  it('fills reportTechnicalNo (not empty after fix)', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(form.reportTechnicalNo).toBeTruthy();
    expect(form.reportTechnicalNo).toMatch(/^RT-\d{8}-DEMO-\d{6}$/);
  });

  it('fills all step-1 required fields', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(validateReportStep(1, form)).toEqual([]);
  });

  it('fills all step-3 client fields', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(validateReportStep(3, form)).toEqual([]);
  });

  it('fills all step-5 technical fields', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(validateReportStep(5, form)).toEqual([]);
  });

  it('fills all step-7 checklist fields', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(validateReportStep(7, form)).toEqual([]);
  });

  it('has three demo parts', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(form.parts.length).toBe(3);
  });

  it('uses the user displayName for engineerName', () => {
    const form = buildDemoForm(MOCK_USER);
    expect(form.signatures.engineerName).toBe(MOCK_USER.displayName);
  });
});

describe('computeFormTotalMeters', () => {
  it('delegates to computeMeterTotal correctly', () => {
    const form = { meters: { bn: '1000', color: '500' } };
    expect(computeFormTotalMeters(form)).toBe('1500');
  });

  it('returns empty string when both fields blank', () => {
    const form = { meters: { bn: '', color: '' } };
    expect(computeFormTotalMeters(form)).toBe('');
  });
});
