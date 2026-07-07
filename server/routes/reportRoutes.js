const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
  submitReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} = require('../controllers/reportController');
const {
  exportOfficialPDF,
  exportOfficialExcel,
  exportRawExcel,
  exportMultiSheetExcel,
  exportBulkPDF
} = require('../controllers/exportController');

// Public: submit a new report (plain JSON)
router.post('/', submitReport);

// Admin-only: bulk export (must be before /:id)
router.get('/export/raw', protect, adminOnly, exportRawExcel);
router.get('/export/multi-sheet', protect, adminOnly, exportMultiSheetExcel);
router.get('/export/bulk-pdf', protect, adminOnly, exportBulkPDF);

// Admin-only: list reports with filters
router.get('/', protect, adminOnly, getReports);

// Admin-only: single report operations
router.get('/:id', protect, adminOnly, getReportById);
router.put('/:id', protect, adminOnly, updateReport);
router.delete('/:id', protect, adminOnly, deleteReport);

// Public/Admin: per-report exports (accessible via unguessable report ObjectID)
router.get('/:id/export/pdf', exportOfficialPDF);
router.get('/:id/export/excel', exportOfficialExcel);

module.exports = router;
