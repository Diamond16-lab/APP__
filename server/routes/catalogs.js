import { Router } from 'express';
import { getReportCatalogs } from '../../shared/reportCatalogs.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getReportCatalogs());
});

export default router;
