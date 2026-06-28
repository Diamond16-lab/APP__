import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '../../server/models/User.js';
import { createServerApp } from '../../server/app.js';
import { startDb, stopDb, clearDb } from '../helpers/db.js';

let app;
let authCookie;

const DEMO_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeReportPayload(overrides = {}) {
  return {
    taskNumber: 'T-2026-001',
    reportTechnicalNo: `RT-20260628-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
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
      faultCode: 'C7-28',
      descriptionSolution: 'Solucion aplicada.',
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
    observations: { client: 'Conforme', ids: '' },
    signatures: {
      clientName: 'Roberto Fuentes',
      clientDataUrl: DEMO_SIGNATURE,
      engineerName: 'Ing. Demo Tecnico',
      engineerDataUrl: DEMO_SIGNATURE,
    },
    ...overrides,
  };
}

beforeAll(async () => {
  await startDb();
  app = createServerApp();

  await User.create({
    username: 'admin',
    passwordHash: await bcrypt.hash('Admin123!', 10),
    displayName: 'Ing. Demo Tecnico',
    employeeNumber: 'IDS-001',
    isActive: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });
  authCookie = res.headers['set-cookie'][0];
});

afterAll(async () => {
  await stopDb();
});

beforeEach(async () => {
  // Only clear reports between tests, keep the user
  const mongoose = await import('mongoose');
  await mongoose.default.connection.collections['reports']?.deleteMany({});
});

describe('POST /api/reports', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/reports').send(makeReportPayload());
    expect(res.status).toBe(401);
  });

  it('creates a report and returns 201 with the saved data', async () => {
    const payload = makeReportPayload();
    const res = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({
      taskNumber: payload.taskNumber,
      reportTechnicalNo: payload.reportTechnicalNo,
      technicianName: 'Ing. Demo Tecnico',
    });
    expect(res.body.report.id).toBeTruthy();
  });

  it('computes and stores meter total', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({ meters: { bn: '1000', color: '500' } }));

    expect(res.status).toBe(201);
    expect(res.body.report.meters.total).toBe('1500');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send({ taskNumber: 'T-001' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('returns 409 on duplicate reportTechnicalNo', async () => {
    const payload = makeReportPayload({ reportTechnicalNo: 'RT-DUPLICATE-001' });

    await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(payload);

    const res = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(payload);

    expect(res.status).toBe(409);
  });

  it('strips empty parts before saving', async () => {
    const payload = makeReportPayload({
      parts: [
        { numParte: '059K65820', cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-001' },
        { numParte: '', cantidad: '', fteCode: '', fteOtherText: '', folio: '' },
      ],
    });

    const res = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.report.parts).toHaveLength(1);
  });
});

describe('GET /api/reports', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(401);
  });

  it('returns an array of reports', async () => {
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload());

    const res = await request(app).get('/api/reports').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.reports).toBeInstanceOf(Array);
    expect(res.body.reports.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by serial number', async () => {
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload({ equipment: { ...makeReportPayload().equipment, serial: 'SERIAL-A-001' } }));
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload({ equipment: { ...makeReportPayload().equipment, serial: 'SERIAL-B-002' } }));

    const res = await request(app)
      .get('/api/reports?serial=SERIAL-A')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.reports.every((r) => r.serial.includes('SERIAL-A'))).toBe(true);
  });

  it('filters by businessName', async () => {
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload({ client: { ...makeReportPayload().client, businessName: 'Acme Corp' } }));
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload({ client: { ...makeReportPayload().client, businessName: 'Globex Inc' } }));

    const res = await request(app)
      .get('/api/reports?businessName=Acme')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.reports.every((r) => r.businessName.includes('Acme'))).toBe(true);
  });
});

describe('GET /api/reports/autocomplete', () => {
  it('returns bySerial and byBusinessName keys', async () => {
    const res = await request(app)
      .get('/api/reports/autocomplete?serial=XRX&businessName=Empresa')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('bySerial');
    expect(res.body).toHaveProperty('byBusinessName');
  });

  it('returns null for both when no reports exist', async () => {
    const res = await request(app)
      .get('/api/reports/autocomplete?serial=NOTFOUND&businessName=NOTFOUND')
      .set('Cookie', authCookie);

    expect(res.body.bySerial).toBeNull();
    expect(res.body.byBusinessName).toBeNull();
  });

  it('returns matching suggestion by serial after a report is created', async () => {
    await request(app).post('/api/reports').set('Cookie', authCookie).send(makeReportPayload({ equipment: { ...makeReportPayload().equipment, serial: 'UNIQUE-SRL-999' } }));

    const res = await request(app)
      .get('/api/reports/autocomplete?serial=UNIQUE-SRL')
      .set('Cookie', authCookie);

    expect(res.body.bySerial).not.toBeNull();
    expect(res.body.bySerial.equipment.serial).toBe('UNIQUE-SRL-999');
  });
});

describe('GET /api/reports/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/reports/aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(res.status).toBe(401);
  });

  it('returns 404 for a valid-format but non-existent ObjectId', async () => {
    const res = await request(app)
      .get('/api/reports/aaaaaaaaaaaaaaaaaaaaaaaa')
      .set('Cookie', authCookie);

    expect(res.status).toBe(404);
  });

  it('returns 404 for an invalid ObjectId format', async () => {
    const res = await request(app)
      .get('/api/reports/not-an-id')
      .set('Cookie', authCookie);

    expect(res.status).toBe(404);
  });

  it('returns the full report for a valid id', async () => {
    const createRes = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({ reportTechnicalNo: 'RT-GETBYID-001' }));

    const id = createRes.body.report.id;

    const res = await request(app)
      .get(`/api/reports/${id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.report.reportTechnicalNo).toBe('RT-GETBYID-001');
    expect(res.body.report.signatures).toBeDefined();
  });
});

describe('GET /api/reports/:id/comparison', () => {
  it('returns null previousReport for the first report on a serial', async () => {
    const createRes = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({ equipment: { ...makeReportPayload().equipment, serial: 'SRL-CMP-001' } }));

    const id = createRes.body.report.id;

    const res = await request(app)
      .get(`/api/reports/${id}/comparison`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.previousReport).toBeNull();
    expect(res.body.deltas).toBeNull();
  });

  it('returns deltas when a prior report exists on the same serial', async () => {
    const serial = 'SRL-CMP-002';

    await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({
        reportTechnicalNo: 'RT-CMP-FIRST',
        equipment: { ...makeReportPayload().equipment, serial },
        documented: { dia: '1', mes: '6', anio: '2026', hora: '10:00' },
        meters: { bn: '1000', color: '500' },
      }));

    const secondRes = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({
        reportTechnicalNo: 'RT-CMP-SECOND',
        equipment: { ...makeReportPayload().equipment, serial },
        documented: { dia: '28', mes: '6', anio: '2026', hora: '10:00' },
        meters: { bn: '2000', color: '1000' },
      }));

    const id = secondRes.body.report.id;

    const res = await request(app)
      .get(`/api/reports/${id}/comparison`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.previousReport).not.toBeNull();
    expect(res.body.previousReport.reportTechnicalNo).toBe('RT-CMP-FIRST');
    expect(res.body.deltas.bn).toBe(1000);
    expect(res.body.deltas.color).toBe(500);
    expect(res.body.deltas.total).toBe(1500);
  });

  it('returns part history aggregated across reports on same serial', async () => {
    const serial = 'SRL-CMP-003';
    const partNum = '059K65820';

    await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({
        reportTechnicalNo: 'RT-CMP-HIST1',
        equipment: { ...makeReportPayload().equipment, serial },
        documented: { dia: '1', mes: '6', anio: '2026', hora: '10:00' },
        parts: [{ numParte: partNum, cantidad: '2', fteCode: '06', fteOtherText: '', folio: 'F-001' }],
      }));

    const secondRes = await request(app)
      .post('/api/reports')
      .set('Cookie', authCookie)
      .send(makeReportPayload({
        reportTechnicalNo: 'RT-CMP-HIST2',
        equipment: { ...makeReportPayload().equipment, serial },
        documented: { dia: '28', mes: '6', anio: '2026', hora: '10:00' },
        parts: [{ numParte: partNum, cantidad: '1', fteCode: '06', fteOtherText: '', folio: 'F-002' }],
      }));

    const id = secondRes.body.report.id;
    const res = await request(app)
      .get(`/api/reports/${id}/comparison`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    const history = res.body.partHistory.find((p) => p.numParte === partNum);
    expect(history).toBeDefined();
    expect(history.totalQuantity).toBe(3);
    expect(history.lastFolio).toBe('F-002');
  });
});
