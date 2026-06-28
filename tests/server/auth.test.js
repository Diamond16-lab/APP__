import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '../../server/models/User.js';
import { createServerApp } from '../../server/app.js';
import { startDb, stopDb, clearDb } from '../helpers/db.js';

let app;

beforeAll(async () => {
  await startDb();
  app = createServerApp();
});

afterAll(async () => {
  await stopDb();
});

beforeEach(async () => {
  await clearDb();
  await User.create({
    username: 'admin',
    passwordHash: await bcrypt.hash('Admin123!', 10),
    displayName: 'Ing. Demo Tecnico',
    employeeNumber: 'IDS-001',
    isActive: true,
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 and user data on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: 'admin',
      displayName: 'Ing. Demo Tecnico',
      employeeNumber: 'IDS-001',
    });
    expect(res.body.user.id).toBeTruthy();
  });

  it('sets a session cookie on successful login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/rt_session=/);
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeTruthy();
  });

  it('returns 401 on non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'Admin123!' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Admin123!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(400);
  });

  it('is case-insensitive for username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ADMIN', password: 'Admin123!' });

    expect(res.status).toBe(200);
  });

  it('returns 401 for an inactive user', async () => {
    await User.findOneAndUpdate({ username: 'admin' }, { isActive: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 204 and clears the session cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(204);
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toMatch(/rt_session=;/);
  });
});

describe('GET /api/auth/session', () => {
  it('returns user: null when no cookie is present', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('returns the user object with a valid session cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });

  it('returns user: null with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/session')
      .set('Cookie', 'rt_session=tampered.token.value');

    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
