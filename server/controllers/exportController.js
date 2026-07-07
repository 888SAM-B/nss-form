const Report = require('../models/Report');
const { generateOfficialPDF, generateBulkPDF } = require('../services/pdfService');
const {
  generateOfficialExcel,
  generateMultiSheetExcel,
  generateRawDataExcel
} = require('../services/excelService');

// @desc    Export single report as PDF (official format)
// @route   GET /api/reports/:id/export/pdf
// @access  Private (Admin)
const exportOfficialPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const pdfBuffer = await generateOfficialPDF(report);

    const safeCollege = report.collegeName.replace(/[^a-zA-Z0-9]/g, '_');
    const safePeriod = report.reportingPeriod.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NSS_Report_${safeCollege}_${safePeriod}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Error generating PDF: ' + error.message });
  }
};

// @desc    Export single report as Excel (official format)
// @route   GET /api/reports/:id/export/excel
// @access  Private (Admin)
const exportOfficialExcel = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const excelBuffer = await generateOfficialExcel(report);

    const safeCollege = report.collegeName.replace(/[^a-zA-Z0-9]/g, '_');
    const safePeriod = report.reportingPeriod.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NSS_Report_${safeCollege}_${safePeriod}.xlsx"`
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Error generating Excel: ' + error.message });
  }
};

// @desc    Export raw data Excel (all/filtered reports, single-row-per-report format)
// @route   GET /api/reports/export/raw
// @access  Private (Admin)
const exportRawExcel = async (req, res) => {
  try {
    const { reportingPeriod, district, submissionId, submissionDate } = req.query;
    const query = {};
    if (reportingPeriod) query.reportingPeriod = new RegExp(reportingPeriod, 'i');
    if (district) query.district = new RegExp(district, 'i');
    if (submissionId) query.submissionId = new RegExp(submissionId.trim(), 'i');
    if (submissionDate) {
      const start = new Date(submissionDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(submissionDate);
      end.setHours(23, 59, 59, 999);
      query.submittedAt = { $gte: start, $lte: end };
    }

    const reports = await Report.find(query).sort({ submittedAt: -1 });
    const buffer = await generateRawDataExcel(reports);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NSS_Raw_Data_Export.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('Raw Excel export error:', error);
    res.status(500).json({ message: 'Error generating raw data: ' + error.message });
  }
};

// @desc    Export multi-sheet Excel (all/filtered reports, one sheet per college, official format)
// @route   GET /api/reports/export/multi-sheet
// @access  Private (Admin)
const exportMultiSheetExcel = async (req, res) => {
  try {
    const { reportingPeriod, district, submissionId, submissionDate } = req.query;
    const query = {};
    if (reportingPeriod) query.reportingPeriod = new RegExp(reportingPeriod, 'i');
    if (district) query.district = new RegExp(district, 'i');
    if (submissionId) query.submissionId = new RegExp(submissionId.trim(), 'i');
    if (submissionDate) {
      const start = new Date(submissionDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(submissionDate);
      end.setHours(23, 59, 59, 999);
      query.submittedAt = { $gte: start, $lte: end };
    }

    const reports = await Report.find(query).sort({ submittedAt: -1 });
    const buffer = await generateMultiSheetExcel(reports);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NSS_Multi_Sheet_Export.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('Multi-sheet Excel export error:', error);
    res.status(500).json({ message: 'Error generating multi-sheet Excel: ' + error.message });
  }
};

// @desc    Export bulk reports as a combined PDF (all/filtered reports)
// @route   GET /api/reports/export/bulk-pdf
// @access  Private (Admin)
const exportBulkPDF = async (req, res) => {
  try {
    const { reportingPeriod, district, submissionId, submissionDate } = req.query;
    const query = {};
    if (reportingPeriod) query.reportingPeriod = new RegExp(reportingPeriod, 'i');
    if (district) query.district = new RegExp(district, 'i');
    if (submissionId) query.submissionId = new RegExp(submissionId.trim(), 'i');
    if (submissionDate) {
      const start = new Date(submissionDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(submissionDate);
      end.setHours(23, 59, 59, 999);
      query.submittedAt = { $gte: start, $lte: end };
    }

    const reports = await Report.find(query).sort({ submittedAt: -1 });
    const buffer = await generateBulkPDF(reports);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NSS_Bulk_Report_Export.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('Bulk PDF export error:', error);
    res.status(500).json({ message: 'Error generating bulk PDF: ' + error.message });
  }
};

module.exports = {
  exportOfficialPDF,
  exportOfficialExcel,
  exportRawExcel,
  exportMultiSheetExcel,
  exportBulkPDF
};
