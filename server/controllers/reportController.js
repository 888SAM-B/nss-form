const Report = require('../models/Report');

const ACTIVITY_NAMES = [
  'Blood Donation Camps',
  'Health Camps',
  'Anti Drug Camps',
  'Voters Awareness SIR',
  'Voters Awareness SVEEP',
  'Road Safety',
  'Tree Plantation',
  'Important Days & Events',
  'Pledge',
  'Rallies',
  'Hosted Meetings',
  'Any Other'
];

const isNonNegativeInt = (val) => {
  if (val === undefined || val === null || val === '') return true; // Allow optional/default to 0
  const n = Number(val);
  return Number.isInteger(n) && n >= 0 && n <= 1000000;
};

const toNum = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  return Number(val) || 0;
};

// @desc    Submit a new quarterly report (public, JSON body)
// @route   POST /api/reports
// @access  Public
const submitReport = async (req, res) => {
  try {
    const {
      reportingPeriod,
      collegeName,
      programmeOfficerName,
      programmeOfficerMobile,
      programmeOfficerEmail,
      district,
      activities,
      socialMedia
    } = req.body;

    // Required field validation
    if (
      !reportingPeriod || !collegeName ||
      !programmeOfficerName || !programmeOfficerMobile ||
      !programmeOfficerEmail || !district
    ) {
      return res.status(400).json({ message: 'All header fields are required.' });
    }

    // Build activities array
    const builtActivities = ACTIVITY_NAMES.map((name) => {
      const raw = Array.isArray(activities)
        ? (activities.find(a => a.activityName === name) || {})
        : {};

      // Common validations
      const fieldsToValidate = [
        'volunteersCount', 'bloodUnitsDonated', 'beneficiariesCount', 'saplingsPlanted', 'distanceKm',
        'programmesConducted', 'collegeParticipated', 'volunteersParticipated', 'beneficiaries'
      ];

      for (const field of fieldsToValidate) {
        if (raw[field] !== undefined && !isNonNegativeInt(raw[field])) {
          throw new Error(`Invalid numeric value for ${field} in activity: ${name}. Must be non-negative integer.`);
        }
      }

      return {
        activityName: name,
        programmeName: raw.programmeName ? String(raw.programmeName).trim() : '',
        volunteersCount: toNum(raw.volunteersCount),
        bloodUnitsDonated: toNum(raw.bloodUnitsDonated),
        beneficiariesCount: toNum(raw.beneficiariesCount),
        saplingsPlanted: toNum(raw.saplingsPlanted),
        eventDate: raw.eventDate ? String(raw.eventDate).trim() : '',
        distanceKm: toNum(raw.distanceKm),
        guestName: raw.guestName ? String(raw.guestName).trim() : '',
        
        // Any Other fields
        programmesConducted: toNum(raw.programmesConducted),
        collegeParticipated: toNum(raw.collegeParticipated),
        volunteersParticipated: toNum(raw.volunteersParticipated),
        beneficiaries: toNum(raw.beneficiaries),
        
        remarks: raw.remarks ? String(raw.remarks).trim() : ''
      };
    });

    const socialMediaData = socialMedia || { instagram: '', facebook: '', youtube: '', x: '', other: '' };

    const report = new Report({
      reportingPeriod: String(reportingPeriod).trim(),
      collegeName: String(collegeName).trim(),
      programmeOfficerName: String(programmeOfficerName).trim(),
      programmeOfficerMobile: String(programmeOfficerMobile).trim(),
      programmeOfficerEmail: String(programmeOfficerEmail).trim(),
      district: String(district).trim(),
      activities: builtActivities,
      socialMedia: socialMediaData,
      submittedAt: new Date()
    });

    const saved = await report.save();

    res.status(201).json({
      message: 'Report submitted successfully',
      submissionId: saved.submissionId,
      reportId: saved._id
    });
  } catch (error) {
    console.error('Submit report error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports with filters
// @route   GET /api/reports
// @access  Private (Admin)
const getReports = async (req, res) => {
  try {
    const { search, district, reportingPeriod, sort, startDate, endDate, submissionId, submissionDate } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ collegeName: regex }, { programmeOfficerName: regex }];
    }
    if (district) query.district = new RegExp(district, 'i');
    if (reportingPeriod) query.reportingPeriod = new RegExp(reportingPeriod, 'i');
    if (submissionId) query.submissionId = new RegExp(submissionId.trim(), 'i');

    if (submissionDate) {
      const start = new Date(submissionDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(submissionDate);
      end.setHours(23, 59, 59, 999);
      query.submittedAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = end;
      }
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const reports = await Report.find(query).sort({ submittedAt: sortOrder });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private (Admin)
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update report (admin edit)
// @route   PUT /api/reports/:id
// @access  Private (Admin)
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const {
      reportingPeriod, collegeName,
      programmeOfficerName, programmeOfficerMobile, programmeOfficerEmail,
      district, activities, socialMedia
    } = req.body;

    if (reportingPeriod !== undefined) report.reportingPeriod = reportingPeriod;
    if (collegeName !== undefined) report.collegeName = collegeName;
    if (programmeOfficerName !== undefined) report.programmeOfficerName = programmeOfficerName;
    if (programmeOfficerMobile !== undefined) report.programmeOfficerMobile = programmeOfficerMobile;
    if (programmeOfficerEmail !== undefined) report.programmeOfficerEmail = programmeOfficerEmail;
    if (district !== undefined) report.district = district;
    if (socialMedia !== undefined) report.socialMedia = socialMedia;

    if (Array.isArray(activities)) {
      report.activities = activities.map(act => ({
        activityName: act.activityName || '',
        programmeName: act.programmeName || '',
        volunteersCount: Number(act.volunteersCount) || 0,
        bloodUnitsDonated: Number(act.bloodUnitsDonated) || 0,
        beneficiariesCount: Number(act.beneficiariesCount) || 0,
        saplingsPlanted: Number(act.saplingsPlanted) || 0,
        eventDate: act.eventDate || '',
        distanceKm: Number(act.distanceKm) || 0,
        guestName: act.guestName || '',
        
        programmesConducted: Number(act.programmesConducted) || 0,
        collegeParticipated: Number(act.collegeParticipated) || 0,
        volunteersParticipated: Number(act.volunteersParticipated) || 0,
        beneficiaries: Number(act.beneficiaries) || 0,
        remarks: act.remarks || ''
      }));
    }

    const updated = await report.save();
    res.json({ message: 'Report updated successfully', report: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    await report.deleteOne();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitReport, getReports, getReportById, updateReport, deleteReport };
