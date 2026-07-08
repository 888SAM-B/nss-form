import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Grid, TextField, Button, Divider,
  Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Paper, CircularProgress, Stack
} from '@mui/material';
import { Edit, Save, Close, PictureAsPdf, GridOn } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { downloadFile } from '../utils/downloadFile';

const ACTIVITIES_META = [
  {
    name: 'Blood Donation Camps',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'bloodUnitsDonated', label: 'Units Donated', type: 'number' }
    ]
  },
  {
    name: 'Health Camps',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
    ]
  },
  {
    name: 'Anti Drug Camps',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
    ]
  },
  {
    name: 'Voters Awareness SIR',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
    ]
  },
  {
    name: 'Voters Awareness SVEEP',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
    ]
  },
  {
    name: 'Road Safety',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
    ]
  },
  {
    name: 'Tree Plantation',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'saplingsPlanted', label: 'No of Saplings Planted', type: 'number' }
    ]
  },
  {
    name: 'Important Days & Events',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'eventDate', label: 'Date', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers Present', type: 'number' }
    ]
  },
  {
    name: 'Pledge',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' }
    ]
  },
  {
    name: 'Rallies',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'eventDate', label: 'Date', type: 'text' },
      { key: 'distanceKm', label: 'Distance in KM', type: 'number' }
    ]
  },
  {
    name: 'Hosted Meetings',
    fields: [
      { key: 'programmeName', label: 'No of Programmes Conducted', type: 'text' },
      { key: 'guestName', label: 'Name of Guest (if any)', type: 'text' },
      { key: 'volunteersCount', label: 'Number of Volunteers', type: 'number' },
      { key: 'beneficiariesCount', label: 'No of Beneficiaries', type: 'number' }
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

function InfoRow({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="500" sx={{ mt: 0.3 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Grid>
  );
}

export default function ReportDetailDialog({ reportId, open, onClose, onUpdated }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (open && reportId) {
      fetchReport();
    }
  }, [open, reportId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports/${reportId}`);
      setReport(res.data);
      setEditData(JSON.parse(JSON.stringify(res.data)));
      setEditMode(false);
    } catch {
      toast.error('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/reports/${reportId}`, editData);
      toast.success('Report updated successfully');
      setReport(editData);
      setEditMode(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const safeName = (report?.collegeName || 'report').replace(/[^a-zA-Z0-9]/g, '_');
      const safePeriod = (report?.reportingPeriod || '').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      await downloadFile(
        `/api/reports/${reportId}/export/${type}`,
        `NSS_Report_${safeName}_${safePeriod}.${ext}`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const updateActivityField = (actName, key, val) => {
    setEditData(prev => ({
      ...prev,
      activities: prev.activities.map(a =>
        a.activityName === actName ? { ...a, [key]: val } : a
      )
    }));
  };

  const data = editMode ? editData : report;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#002f6c', color: '#fff' }}>
        <Typography fontWeight="bold" fontSize={16}>
          Report Details — {report?.submissionId}
        </Typography>
        <Box display="flex" gap={1}>
          {!editMode ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditMode(true)}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={saving}
              >
                Save
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => { setEditMode(false); setEditData(JSON.parse(JSON.stringify(report))); }}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            size="small"
            onClick={onClose}
            sx={{ color: '#fff', minWidth: 36 }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : !data ? null : (
          <Box>
            {/* Header Info */}
            <Box sx={{ p: 3, bgcolor: '#f8faff' }}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2} textTransform="uppercase">
                College &amp; Officer Information
              </Typography>
              <Grid container spacing={2}>
                {editMode ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField label="College Name" fullWidth size="small"
                        value={editData.collegeName}
                        onChange={e => setEditData(p => ({ ...p, collegeName: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Reporting Period" fullWidth size="small"
                        value={editData.reportingPeriod}
                        onChange={e => setEditData(p => ({ ...p, reportingPeriod: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Programme Officer Name" fullWidth size="small"
                        value={editData.programmeOfficerName}
                        onChange={e => setEditData(p => ({ ...p, programmeOfficerName: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="District" fullWidth size="small"
                        value={editData.district}
                        onChange={e => setEditData(p => ({ ...p, district: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Mobile" fullWidth size="small"
                        value={editData.programmeOfficerMobile}
                        onChange={e => setEditData(p => ({ ...p, programmeOfficerMobile: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Email" fullWidth size="small"
                        value={editData.programmeOfficerEmail}
                        onChange={e => setEditData(p => ({ ...p, programmeOfficerEmail: e.target.value }))} />
                    </Grid>
                  </>
                ) : (
                  <>
                    <InfoRow label="Reporting Period" value={data.reportingPeriod} />
                    <InfoRow label="College Name" value={data.collegeName} />
                    <InfoRow label="District" value={data.district} />
                    <InfoRow label="Programme Officer" value={data.programmeOfficerName} />
                    <InfoRow label="Mobile" value={data.programmeOfficerMobile} />
                    <InfoRow label="Email" value={data.programmeOfficerEmail} />
                    <InfoRow label="Submitted On" value={data.submittedAt ? new Date(data.submittedAt).toLocaleString('en-IN') : '—'} />
                  </>
                )}
              </Grid>
            </Box>

            <Divider />

            {/* Activities Section */}
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2} textTransform="uppercase">
                Activity-wise Report
              </Typography>
              
              <Stack spacing={2.5}>
                {ACTIVITIES_META.map((meta, idx) => {
                  const act = data.activities?.find(a => a.activityName === meta.name) || {};
                  return (
                    <Paper key={meta.name} variant="outlined" sx={{ p: 2, bgcolor: idx % 2 === 0 ? '#fcfdfe' : '#fff' }}>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary.dark" mb={1.5}>
                        {idx + 1}. {meta.name}
                      </Typography>

                      <Grid container spacing={2}>
                        {meta.fields.map(f => {
                          const val = act[f.key] ?? '';
                          return (
                            <Grid item xs={12} sm={4} key={f.key}>
                              {editMode ? (
                                <TextField
                                  label={f.label}
                                  fullWidth
                                  size="small"
                                  type={f.type}
                                  value={val}
                                  onChange={e => {
                                    const parsed = f.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value;
                                    updateActivityField(meta.name, f.key, parsed);
                                  }}
                                />
                              ) : (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {f.label}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500}>
                                    {val === '' ? '—' : val}
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>

            <Divider />

            {/* Social Media */}
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2} textTransform="uppercase">
                Social Media
              </Typography>
              <Grid container spacing={2}>
                {['instagram', 'facebook', 'youtube', 'x', 'other'].map(key => {
                  const labels = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', x: 'X (Twitter)', other: 'Other' };
                  return (
                    <Grid item xs={12} sm={4} key={key}>
                      {editMode ? (
                        <TextField
                          label={labels[key]}
                          fullWidth
                          size="small"
                          value={editData.socialMedia?.[key] || ''}
                          onChange={e => setEditData(p => ({ ...p, socialMedia: { ...p.socialMedia, [key]: e.target.value } }))}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="text.secondary">{labels[key]}</Typography>
                          <Typography variant="body2">{data.socialMedia?.[key] || '—'}</Typography>
                        </Box>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* Download buttons */}
            <Box sx={{ p: 3, bgcolor: '#f8faff', borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                Download Report
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={downloading === 'pdf' ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
                  disabled={!!downloading}
                  onClick={() => handleDownload('pdf')}
                >
                  PDF
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={downloading === 'excel' ? <CircularProgress size={16} color="inherit" /> : <GridOn />}
                  disabled={!!downloading}
                  onClick={() => handleDownload('excel')}
                >
                  Excel
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
