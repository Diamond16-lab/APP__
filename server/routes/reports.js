import { Router } from 'express';
import mongoose from 'mongoose';
import { Report } from '../models/Report.js';
import { normalizeReportPayload, serializeReport, validateReportPayload } from '../utils/reportPayload.js';

const router = Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAutocompleteSuggestion(report) {
  if (!report) return null;

  return {
    sourceReportId: report._id.toString(),
    reportTechnicalNo: report.reportTechnicalNo,
    reportDate: report.reportDate,
    client: {
      businessName: report.client?.businessName || '',
      reportedByName: report.client?.reportedByName || '',
      reportedByArea: report.client?.reportedByArea || '',
      address: report.client?.address || '',
      phone: report.client?.phone || '',
      cityState: report.client?.cityState || '',
    },
    equipment: {
      model: report.equipment?.model || '',
      serial: report.equipment?.serial || '',
      system: report.equipment?.system || '',
      subsystem: report.equipment?.subsystem || '',
    },
  };
}

router.post('/', async (req, res) => {
  const errors = validateReportPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Invalid report payload.', errors });
  }

  const normalized = normalizeReportPayload(req.body, req.user);

  try {
    const report = await Report.create(normalized);
    return res.status(201).json({ report: serializeReport(report) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A report with the same folio already exists.' });
    }
    throw error;
  }
});

router.get('/', async (req, res) => {
  const {
    serial = '',
    clientName = '',
    businessName = '',
    technician = '',
    dateFrom = '',
    dateTo = '',
  } = req.query;

  const query = {};

  if (serial) query['equipment.serial'] = { $regex: escapeRegex(String(serial).trim()), $options: 'i' };
  if (clientName) query['signatures.clientName'] = { $regex: escapeRegex(String(clientName).trim()), $options: 'i' };
  if (businessName) query['client.businessName'] = { $regex: escapeRegex(String(businessName).trim()), $options: 'i' };
  if (technician) query.technicianName = { $regex: escapeRegex(String(technician).trim()), $options: 'i' };

  if (dateFrom || dateTo) {
    query.reportDate = {};
    if (dateFrom) {
      query.reportDate.$gte = new Date(`${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query.reportDate.$lte = new Date(`${dateTo}T23:59:59`);
    }
  }

  const reports = await Report.find(query)
    .sort({ reportDate: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return res.json({
    reports: reports.map((report) => ({
      id: report._id.toString(),
      reportTechnicalNo: report.reportTechnicalNo,
      taskNumber: report.taskNumber,
      reportDate: report.reportDate,
      businessName: report.client.businessName,
      serial: report.equipment.serial,
      model: report.equipment.model,
      technicianName: report.technicianName,
      employeeNumber: report.employeeNumber,
      generatedBy: report.generatedBy
        ? {
            ...report.generatedBy,
            userId: report.generatedBy.userId?.toString?.() ?? report.generatedBy.userId,
          }
        : null,
      generatedAt: report.generatedAt || report.createdAt,
      totalMeters: report.meters.total,
      clientName: report.signatures.clientName,
      partsCount: report.parts.length,
    })),
  });
});

router.get('/autocomplete', async (req, res) => {
  const serial = String(req.query.serial || '').trim();
  const businessName = String(req.query.businessName || '').trim();
  const sortByRecent = { reportDate: -1, createdAt: -1 };

  const [bySerial, byBusinessName] = await Promise.all([
    serial.length >= 3
      ? Report.findOne({ 'equipment.serial': { $regex: escapeRegex(serial), $options: 'i' } })
        .sort(sortByRecent)
        .lean()
      : null,
    businessName.length >= 3
      ? Report.findOne({ 'client.businessName': { $regex: escapeRegex(businessName), $options: 'i' } })
        .sort(sortByRecent)
        .lean()
      : null,
  ]);

  return res.json({
    bySerial: buildAutocompleteSuggestion(bySerial),
    byBusinessName: buildAutocompleteSuggestion(byBusinessName),
  });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  return res.json({ report: serializeReport(report) });
});

router.get('/:id/comparison', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const report = await Report.findById(req.params.id).lean();
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const previousReport = await Report.findOne({
    'equipment.serial': report.equipment.serial,
    reportDate: { $lt: report.reportDate },
  })
    .sort({ reportDate: -1, createdAt: -1 })
    .lean();

  const allParts = await Report.aggregate([
    {
      $match: {
        'equipment.serial': report.equipment.serial,
        reportDate: { $lte: report.reportDate },
      },
    },
    { $sort: { reportDate: 1, createdAt: 1 } },
    { $unwind: '$parts' },
    {
      $group: {
        _id: '$parts.numParte',
        totalQuantity: { $sum: { $convert: { input: '$parts.cantidad', to: 'int', onError: 0, onNull: 0 } } },
        lastUsedAt: { $max: '$reportDate' },
        lastFolio: { $last: '$parts.folio' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const currentBn = Number(report.meters?.bn || 0);
  const currentColor = Number(report.meters?.color || 0);
  const currentTotal = Number(report.meters?.total || 0);
  const previousBn = Number(previousReport?.meters?.bn || 0);
  const previousColor = Number(previousReport?.meters?.color || 0);
  const previousTotal = Number(previousReport?.meters?.total || 0);

  return res.json({
    previousReport: previousReport
      ? {
          id: previousReport._id.toString(),
          reportTechnicalNo: previousReport.reportTechnicalNo,
          reportDate: previousReport.reportDate,
          technicianName: previousReport.technicianName,
          meters: previousReport.meters,
        }
      : null,
    deltas: previousReport
      ? {
          bn: currentBn - previousBn,
          color: currentColor - previousColor,
          total: currentTotal - previousTotal,
        }
      : null,
    partHistory: allParts
      .filter((entry) => entry._id)
      .map((entry) => ({
        numParte: entry._id,
        totalQuantity: entry.totalQuantity,
        lastUsedAt: entry.lastUsedAt,
        lastFolio: entry.lastFolio,
      })),
  });
});

export default router;
