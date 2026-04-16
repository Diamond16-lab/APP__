import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalogs.js';
import reportRoutes from './routes/reports.js';
import { requireAuth } from './middleware/requireAuth.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

export function createServerApp() {
  const app = express();

  app.use(express.json({ limit: '12mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/catalogs', catalogRoutes);
  app.use('/api/reports', requireAuth, reportRoutes);

  if (env.nodeEnv === 'production') {
    app.use(express.static(distPath));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        ok: true,
        message: 'API de reporte tecnico activa.',
        frontend: 'http://127.0.0.1:5173',
        health: 'http://127.0.0.1:4000/api/health',
      });
    });
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API route not found.' });
  });

  app.use((error, _req, res, _next) => {
    void _next;
    console.error(error);
    return res.status(500).json({
      message: env.nodeEnv === 'production'
        ? 'Internal server error.'
        : error.message || 'Internal server error.',
    });
  });

  return app;
}
