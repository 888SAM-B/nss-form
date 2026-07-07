const mongoose = require('mongoose');

// Helper to generate short submission ID
function generateSubmissionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'NSS-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const ActivitySchema = new mongoose.Schema({
  activityName: { type: String, required: true },
  
  // Specific fields for different activities
  programmeName: { type: String, default: '' },
  volunteersCount: { type: Number, default: 0 },
  bloodUnitsDonated: { type: Number, default: 0 },
  beneficiariesCount: { type: Number, default: 0 },
  saplingsPlanted: { type: Number, default: 0 },
  eventDate: { type: String, default: '' },
  distanceKm: { type: Number, default: 0 },
  guestName: { type: String, default: '' },
  
  // Any Other / standard fields
  programmesConducted: { type: Number, default: 0 },
  collegeParticipated: { type: Number, default: 0 },
  volunteersParticipated: { type: Number, default: 0 },
  beneficiaries: { type: Number, default: 0 },
  
  remarks: { type: String, default: '' }
}, { _id: false });

const ReportSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    unique: true,
    default: generateSubmissionId
  },
  reportingPeriod: { type: String, required: true, trim: true },
  collegeName: { type: String, required: true, trim: true },
  programmeOfficerName: { type: String, required: true, trim: true },
  programmeOfficerMobile: { type: String, required: true, trim: true },
  programmeOfficerEmail: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  activities: [ActivitySchema],
  socialMedia: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    x: { type: String, default: '' },
    other: { type: String, default: '' }
  },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
