import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Grid, CircularProgress, Alert, MenuItem, Select,
  FormControl, InputLabel, Paper, Stack
} from '@mui/material';
import {
  CheckCircle, School, Person, Campaign, Share, Send,
  PictureAsPdf, GridOn, ArrowBack
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { downloadFile } from '../utils/downloadFile';

const ACTIVITIES_META = [
  {
    name: 'Blood Donation Camps',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'bloodUnitsDonated', label: 'No of Units of Blood Donated *', type: 'number' }
    ]
  },
  {
    name: 'Health Camps',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Anti Drug Camps',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Voters Awareness SIR',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Voters Awareness SVEEP',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Road Safety',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Tree Plantation',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'saplingsPlanted', label: 'No of Saplings Planted *', type: 'number' }
    ]
  },
  {
    name: 'Important Days & Events',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'eventDate', label: 'Date (e.g. DD/MM/YYYY) *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers Present *', type: 'number' }
    ]
  },
  {
    name: 'Pledge',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' }
    ]
  },
  {
    name: 'Rallies',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'eventDate', label: 'Date (e.g. DD/MM/YYYY) *', type: 'text' },
      { key: 'distanceKm', label: 'Distance in KM *', type: 'number' }
    ]
  },
  {
    name: 'Hosted Meetings',
    fields: [
      { key: 'programmeName', label: 'Name of the Programme *', type: 'text' },
      { key: 'guestName', label: 'Name of Guest (if any)', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers *', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries *', type: 'number' }
    ]
  },
  {
    name: 'Any Other',
    fields: [
      { key: 'programmesConducted', label: 'Programmes Conducted', type: 'number' },
      { key: 'collegeParticipated', label: 'Colleges Participated', type: 'number' },
      { key: 'volunteersParticipated', label: 'Volunteers Participated', type: 'number' },
      { key: 'beneficiaries', label: 'Beneficiaries', type: 'number' },
      { key: 'remarks', label: 'Remarks (optional)', type: 'text' }
    ]
  }
];

const REPORTING_PERIODS = [
  'April - June 2025',
  'July - September 2025',
  'October - December 2025',
  'January - March 2026',
  'April - June 2026',
  'July - September 2026',
  'October - December 2026',
  'January - March 2027'
];

const initActivities = () => {
  const state = {};
  ACTIVITIES_META.forEach(act => {
    state[act.name] = {};
    act.fields.forEach(f => {
      state[act.name][f.key] = '';
    });
  });
  return state;
};

export default function ReportForm() {
  const [header, setHeader] = useState({
    reportingPeriod: 'April - June 2026',
    collegeName: '',
    programmeOfficerName: '',
    programmeOfficerMobile: '',
    programmeOfficerEmail: '',
    district: ''
  });

  const [activities, setActivities] = useState(initActivities());
  const [socialMedia, setSocialMedia] = useState({
    instagram: '', facebook: '', youtube: '', x: '', other: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportId, setReportId] = useState('');
  const [downloading, setDownloading] = useState(null);

  const validateHeader = () => {
    const errs = {};
    if (!header.reportingPeriod) errs.reportingPeriod = 'Required';
    if (!header.collegeName.trim()) errs.collegeName = 'Required';
    if (!header.programmeOfficerName.trim()) errs.programmeOfficerName = 'Required';
    if (!header.programmeOfficerMobile.trim()) errs.programmeOfficerMobile = 'Required';
    else if (!/^\d{10}$/.test(header.programmeOfficerMobile.trim()))
      errs.programmeOfficerMobile = 'Enter valid 10-digit mobile number';
    if (!header.programmeOfficerEmail.trim()) errs.programmeOfficerEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(header.programmeOfficerEmail.trim()))
      errs.programmeOfficerEmail = 'Invalid email address';
    if (!header.district.trim()) errs.district = 'Required';
    return errs;
  };

  const handleActivityChange = (actName, fieldKey, val) => {
    setActivities(prev => ({
      ...prev,
      [actName]: {
        ...prev[actName],
        [fieldKey]: val
      }
    }));
  };

  const handlePreviewRequest = () => {
    const headerErrs = validateHeader();
    const actErrs = {};

    ACTIVITIES_META.forEach(act => {
      const state = activities[act.name];
      act.fields.forEach(f => {
        const val = state[f.key];
        // Validate required fields
        if (f.label.includes('*')) {
          if (val === undefined || val === null || String(val).trim() === '') {
            if (!actErrs[act.name]) actErrs[act.name] = {};
            actErrs[act.name][f.key] = 'Required';
          }
        }
        // Validate numbers
        if (f.type === 'number' && val !== '' && val !== undefined && val !== null) {
          const n = Number(val);
          if (isNaN(n) || !Number.isInteger(n) || n < 0 || n > 1000000) {
            if (!actErrs[act.name]) actErrs[act.name] = {};
            actErrs[act.name][f.key] = 'Enter valid positive number (0-1,000,000)';
          }
        }
      });
    });

    if (Object.keys(headerErrs).length > 0 || Object.keys(actErrs).length > 0) {
      setErrors({ ...headerErrs, activities: actErrs });
      toast.error('Please fix the highlighted errors before proceeding');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        universityName: 'N/A', // kept inside payload for backend safety or defaulted
        ...header,
        activities: ACTIVITIES_META.map(act => {
          const raw = activities[act.name];
          const parsed = { activityName: act.name };
          act.fields.forEach(f => {
            if (f.type === 'number') {
              parsed[f.key] = raw[f.key] !== '' ? Number(raw[f.key]) : 0;
            } else {
              parsed[f.key] = raw[f.key] || '';
            }
          });
          return parsed;
        }),
        socialMedia
      };

      const res = await axios.post('/api/reports', payload);
      const newReportId = res.data.reportId;
      setSubmissionId(res.data.submissionId);
      setReportId(newReportId);
      setSubmitted(true);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Report submitted successfully!');

      // Automatically trigger report PDF download
      try {
        const safeName = (header.collegeName || 'report').replace(/[^a-zA-Z0-9]/g, '_');
        const safePeriod = (header.reportingPeriod || '').replace(/[^a-zA-Z0-9]/g, '_');
        await downloadFile(
          `/api/reports/${newReportId}/export/pdf`,
          `NSS_Report_${safeName}_${safePeriod}.pdf`
        );
      } catch (dlErr) {
        console.error('Auto download failed:', dlErr);
      }

    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (type) => {
    if (!reportId) return;
    setDownloading(type);
    try {
      const safeName = (header.collegeName || 'report').replace(/[^a-zA-Z0-9]/g, '_');
      const safePeriod = (header.reportingPeriod || '').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      await downloadFile(
        `/api/reports/${reportId}/export/${type}`,
        `NSS_Report_${safeName}_${safePeriod}.${ext}`
      );
    } catch (err) {
      toast.error(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setHeader({ reportingPeriod: 'April - June 2026', collegeName: '', programmeOfficerName: '', programmeOfficerMobile: '', programmeOfficerEmail: '', district: '' });
    setActivities(initActivities());
    setSocialMedia({ instagram: '', facebook: '', youtube: '', x: '', other: '' });
    setErrors({});
    setReportId('');
    setShowPreview(false);
  };

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #002f6c 0%, #004aad 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 550, width: '100%', textAlign: 'center', borderRadius: 4, p: 2 }}>
          <CardContent sx={{ py: 5 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
              Report Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Your NSS Quarterly Report has been submitted successfully.
            </Typography>
            <Paper elevation={3} sx={{ p: 2.5, bgcolor: '#f0f7ff', borderRadius: 2, mb: 3.5, display: 'inline-block', minWidth: 280 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                YOUR SUBMISSION ID
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary" letterSpacing={2}>
                {submissionId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please save this ID for your records
              </Typography>
            </Paper>

            <Box sx={{ mb: 4, p: 2.5, border: '1px dashed #4caf50', borderRadius: 2, bgcolor: '#f1fcf1' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="success.dark" mb={1.5}>
                📄 Download Submitted Report
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={downloading === 'pdf' ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
                  disabled={!!downloading}
                  onClick={() => handleDownload('pdf')}
                  sx={{ px: 3 }}
                >
                  PDF
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={downloading === 'excel' ? <CircularProgress size={16} color="inherit" /> : <GridOn />}
                  disabled={!!downloading}
                  onClick={() => handleDownload('excel')}
                  sx={{ px: 3 }}
                >
                  Excel
                </Button>
              </Stack>
            </Box>

            <Box>
              <Button variant="outlined" onClick={handleReset}>
                Submit Another Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (showPreview) {
    return (
      <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #002f6c 0%, #004aad 100%)', color: '#fff', py: 3, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={2} display="flex" justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Box component="img" src="/periyar_logo.png" alt="Periyar University Logo" sx={{ height: 80, objectFit: 'contain', bgcolor: '#fff', p: 0.5, borderRadius: '50%' }} />
            </Grid>
            
            <Grid item xs={12} md={8} sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" letterSpacing={0.5} gutterBottom>
                PERIYAR UNIVERSITY
              </Typography>
              <Typography variant="caption" display="block" sx={{ opacity: 0.85, fontSize: '0.85rem', fontWeight: 600, mt: -0.5, mb: 0.5 }}>
                SALEM, TAMIL NADU
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary.light" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
                National Service Scheme (NSS)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: 'bold' }}>
                Review &amp; Verify Your Quarterly Activity Report
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={2} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Box component="img" src="/nss_logo.png" alt="NSS Logo" sx={{ height: 80, objectFit: 'contain', bgcolor: '#fff', p: 0.5, borderRadius: '50%' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

        <Container maxWidth="lg">
          <Alert severity="warning" sx={{ mb: 4, fontWeight: 'bold' }}>
            This is a preview. Scroll to the bottom and click "Confirm & Submit" to finalize your report.
          </Alert>

          {/* Basic Info Preview */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <School color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">Basic Information</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">Reporting Period</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.reportingPeriod}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">College Name</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.collegeName}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">District</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.district}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Programme Officer Preview */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">Programme Officer Details</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">Name</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.programmeOfficerName}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">Mobile Number</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.programmeOfficerMobile}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                  <Typography variant="body1" fontWeight="bold">{header.programmeOfficerEmail}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Activities Preview */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Campaign color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">Activity-wise Performance</Typography>
              </Box>

              <Stack spacing={2.5}>
                {ACTIVITIES_META.map((act, idx) => {
                  const state = activities[act.name];
                  return (
                    <Paper key={act.name} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: idx % 2 === 0 ? '#fafbff' : '#fff' }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 1.5 }}>
                        {idx + 1}. {act.name}
                      </Typography>
                      <Grid container spacing={2}>
                        {act.fields.map(f => {
                          const val = state[f.key];
                          return (
                            <Grid item xs={12} sm={act.fields.length > 3 ? 3 : 4} key={f.key}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {f.label.replace(' *', '').replace(' (optional)', '')}
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {val === '' || val === undefined || val === null ? '—' : val}
                              </Typography>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Social Media Preview */}
          <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Share color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">Social Media Presence</Typography>
              </Box>
              <Grid container spacing={2}>
                {[
                  { key: 'instagram', label: 'Instagram' },
                  { key: 'facebook', label: 'Facebook' },
                  { key: 'youtube', label: 'YouTube' },
                  { key: 'x', label: 'X (Twitter)' },
                  { key: 'other', label: 'Other Social' }
                ].map(({ key, label }) => (
                  <Grid item xs={12} sm={4} key={key}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{socialMedia[key] || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Actions */}
          <Box display="flex" justifyContent="center" gap={3}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setShowPreview(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              startIcon={<ArrowBack />}
              sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
            >
              Back to Edit
            </Button>
            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={handleFinalSubmit}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              sx={{
                px: 5, py: 1.5, fontWeight: 'bold',
                background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                '&:hover': { background: 'linear-gradient(135deg, #1b5e20, #388e3c)' }
              }}
            >
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 8 }}>
      {/* Header Banner */}
      <Box sx={{ background: 'linear-gradient(135deg, #002f6c 0%, #004aad 100%)', color: '#fff', py: 3, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={2} display="flex" justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Box component="img" src="/periyar_logo.png" alt="Periyar University Logo" sx={{ height: 80, objectFit: 'contain', bgcolor: '#fff', p: 0.5, borderRadius: '50%' }} />
            </Grid>
            
            <Grid item xs={12} md={8} sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" letterSpacing={0.5} gutterBottom>
                PERIYAR UNIVERSITY
              </Typography>
              <Typography variant="caption" display="block" sx={{ opacity: 0.85, fontSize: '0.85rem', fontWeight: 600, mt: -0.5, mb: 0.5 }}>
                SALEM, TAMIL NADU
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary.light" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
                National Service Scheme (NSS)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                NSS Quarterly Report Digitization System
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={2} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Box component="img" src="/nss_logo.png" alt="NSS Logo" sx={{ height: 80, objectFit: 'contain', bgcolor: '#fff', p: 0.5, borderRadius: '50%' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">

        {/* Section 1: Basic Information */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <School color="primary" />
              <Typography variant="h6" fontWeight="bold" color="primary">Basic Information</Typography>
            </Box>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="reportingPeriod"
                  label="Reporting Period"
                  fullWidth
                  value={header.reportingPeriod}
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled
                  helperText="Fixed by administrator"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="collegeName"
                  label="College Name *"
                  fullWidth
                  value={header.collegeName}
                  onChange={e => setHeader({ ...header, collegeName: e.target.value })}
                  error={!!errors.collegeName}
                  helperText={errors.collegeName}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section 2: Programme Officer */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Person color="primary" />
              <Typography variant="h6" fontWeight="bold" color="primary">Programme Officer Details</Typography>
            </Box>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="programmeOfficerName"
                  label="Programme Officer Name *"
                  fullWidth
                  value={header.programmeOfficerName}
                  onChange={e => setHeader({ ...header, programmeOfficerName: e.target.value })}
                  error={!!errors.programmeOfficerName}
                  helperText={errors.programmeOfficerName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="district"
                  label="District *"
                  fullWidth
                  value={header.district}
                  onChange={e => setHeader({ ...header, district: e.target.value })}
                  error={!!errors.district}
                  helperText={errors.district}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="programmeOfficerMobile"
                  label="Mobile Number *"
                  fullWidth
                  value={header.programmeOfficerMobile}
                  onChange={e => setHeader({ ...header, programmeOfficerMobile: e.target.value })}
                  error={!!errors.programmeOfficerMobile}
                  helperText={errors.programmeOfficerMobile}
                  inputProps={{ maxLength: 10 }}
                  placeholder="10-digit mobile number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="programmeOfficerEmail"
                  label="Email Address *"
                  type="email"
                  fullWidth
                  value={header.programmeOfficerEmail}
                  onChange={e => setHeader({ ...header, programmeOfficerEmail: e.target.value })}
                  error={!!errors.programmeOfficerEmail}
                  helperText={errors.programmeOfficerEmail}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section 3: Activities */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Campaign color="primary" />
              <Typography variant="h6" fontWeight="bold" color="primary">Activity-wise Report</Typography>
            </Box>

            {ACTIVITIES_META.map((act, idx) => {
              const hasErr = !!errors.activities?.[act.name];
              return (
                <Box key={act.name} sx={{ mb: 2.5 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: hasErr ? '1.5px solid #d32f2f' : '1px solid #dde3f0',
                      bgcolor: idx % 2 === 0 ? '#fafbff' : '#fff'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>
                      {idx + 1}. {act.name}
                    </Typography>

                    <Grid container spacing={2}>
                      {act.fields.map(f => {
                        const isNum = f.type === 'number';
                        const errText = errors.activities?.[act.name]?.[f.key] || '';

                        return (
                          <Grid item xs={12} sm={act.fields.length > 3 ? 3 : 4} key={f.key}>
                            <TextField
                              id={`${act.name}-${f.key}`}
                              label={f.label}
                              fullWidth
                              size="small"
                              type={f.type}
                              value={activities[act.name][f.key]}
                              onChange={e => handleActivityChange(act.name, f.key, e.target.value)}
                              error={!!errText}
                              helperText={errText}
                              inputProps={isNum ? { min: 0 } : undefined}
                              onKeyDown={isNum ? (e) => {
                                if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                              } : undefined}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* Section 4: Social Media */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Share color="primary" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                Social Media Presence <Typography component="span" variant="body2" color="text.secondary">(Optional)</Typography>
              </Typography>
            </Box>
            <Grid container spacing={2.5}>
              {[
                { key: 'instagram', label: 'Instagram URL / Handle' },
                { key: 'facebook', label: 'Facebook Page URL' },
                { key: 'youtube', label: 'YouTube Channel URL' },
                { key: 'x', label: 'X (Twitter) Handle' },
                { key: 'other', label: 'Other Social Media' }
              ].map(({ key, label }) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    id={`social-${key}`}
                    label={label}
                    fullWidth
                    size="small"
                    value={socialMedia[key]}
                    onChange={e => setSocialMedia({ ...socialMedia, [key]: e.target.value })}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        <center>
          <Typography display="block" color="text.secondary" mt={1.5}>
            Kindly review all information before submitting.
          </Typography>
        </center>
        {/* Submit */}
        <Box textAlign="center">
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              Please correct the errors above before submitting.
            </Alert>
          )}

          <Button
            id="submit-report-btn"
            variant="contained"
            size="large"
            onClick={handlePreviewRequest}
            startIcon={<Send />}
            sx={{
              px: 6, py: 1.6, fontSize: '1.1rem', fontWeight: 'bold',
              background: 'linear-gradient(135deg, #002f6c, #0061d5)',
              '&:hover': { background: 'linear-gradient(135deg, #001f4e, #004aad)' }
            }}
          >
            Review &amp; Submit
          </Button>

        </Box>
      </Container>
    </Box>
  );
}
