import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Container,
  Card, CardContent, Grid, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Stack, Tooltip, Alert, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  ExitToApp, Visibility, Delete, PictureAsPdf, GridOn,
  Search, AdminPanelSettings, DownloadForOffline
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ReportDetailDialog from '../components/ReportDetailDialog';
import { downloadFile } from '../utils/downloadFile';

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

export default function AdminDashboard() {
  const { logout } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  // Filters
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterSubmissionId, setFilterSubmissionId] = useState('');
  const [filterSubmissionDate, setFilterSubmissionDate] = useState('');
  const [sort, setSort] = useState('newest');

  // Detail dialog
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  // Download state (tracks which report is currently downloading)
  const [downloadingId, setDownloadingId] = useState(null);

  // Cumulative dashboard states
  const [showDashboard, setShowDashboard] = useState(true);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [selectedCellActivity, setSelectedCellActivity] = useState('');
  const [selectedCellMetric, setSelectedCellMetric] = useState('');
  const [selectedCellContributors, setSelectedCellContributors] = useState([]);

  const handleCellClick = (activity, metric, contributors) => {
    setSelectedCellActivity(activity);
    setSelectedCellMetric(metric);
    setSelectedCellContributors(contributors || []);
    setCellDialogOpen(true);
  };

  const { stats, socialCounts } = React.useMemo(() => {
    const parseProgCount = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const match = String(val).match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const initActivityStats = () => ({
      progs: { total: 0, list: [] },
      colleges: { total: 0, list: [] },
      volunteers: { total: 0, list: [] },
      beneficiaries: { total: 0, list: [] }
    });

    const currentStats = {
      specialCamps: initActivityStats(),
      bloodDonation: initActivityStats(),
      healthCamps: initActivityStats(),
      antiDrug: initActivityStats(),
      votersSIR: initActivityStats(),
      votersSVEEP: initActivityStats(),
      roadSafety: initActivityStats(),
      treePlantation: initActivityStats(),
      importantDays: initActivityStats(),
      pledge: initActivityStats(),
      rallies: initActivityStats(),
      hostedMeetings: initActivityStats(),
      anyOther: initActivityStats()
    };

    const currentSocialCounts = {
      instagram: { total: 0, list: [] },
      x: { total: 0, list: [] },
      facebook: { total: 0, list: [] },
      youtube: { total: 0, list: [] },
      other: { total: 0, list: [] }
    };

    const isValidSocialLink = (url) => {
      if (!url) return false;
      const clean = url.trim().toLowerCase();
      if (!clean) return false;
      if (
        clean === 'nil' ||
        clean === '-' ||
        clean === 'none' ||
        clean === 'no' ||
        clean === 'na' ||
        clean === 'n/a' ||
        clean === 'nil.' ||
        clean === 'Ni.' ||
        clean === 'ni.' ||
        clean === 'not submitted' ||
        clean === 'not active' ||
        clean === 'not link' ||
        clean === 'no link'
      ) {
        return false;
      }
      return true;
    };

    reports.forEach(report => {
      const acts = report.activities || [];
      const sm = report.socialMedia || {};
      const contributorBase = {
        reportId: report._id,
        collegeName: report.collegeName,
        poName: report.programmeOfficerName,
        district: report.district,
        submittedAt: report.submittedAt
      };

      // 1. Calculate Social Media
      if (sm.instagram && isValidSocialLink(sm.instagram)) {
        currentSocialCounts.instagram.total += 1;
        currentSocialCounts.instagram.list.push({ ...contributorBase, value: sm.instagram, label: sm.instagram });
      }
      if (sm.facebook && isValidSocialLink(sm.facebook)) {
        currentSocialCounts.facebook.total += 1;
        currentSocialCounts.facebook.list.push({ ...contributorBase, value: sm.facebook, label: sm.facebook });
      }
      if (sm.youtube && isValidSocialLink(sm.youtube)) {
        currentSocialCounts.youtube.total += 1;
        currentSocialCounts.youtube.list.push({ ...contributorBase, value: sm.youtube, label: sm.youtube });
      }
      if (sm.x && isValidSocialLink(sm.x)) {
        currentSocialCounts.x.total += 1;
        currentSocialCounts.x.list.push({ ...contributorBase, value: sm.x, label: sm.x });
      }
      if (sm.other && isValidSocialLink(sm.other)) {
        currentSocialCounts.other.total += 1;
        currentSocialCounts.other.list.push({ ...contributorBase, value: sm.other, label: sm.other });
      }

      // 2. Calculate Activities
      acts.forEach(act => {
        const name = act.activityName;
        let key = null;
        let pCount = parseProgCount(act.programmeName);
        let vCount = act.volunteersCount || 0;
        let bCount = 0;

        switch (name) {
          case 'Blood Donation Camps':
            key = 'bloodDonation';
            bCount = act.bloodUnitsDonated || 0;
            break;
          case 'Health Camps':
            key = 'healthCamps';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Anti Drug Camps':
            key = 'antiDrug';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Voters Awareness SIR':
            key = 'votersSIR';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Voters Awareness SVEEP':
            key = 'votersSVEEP';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Road Safety':
            key = 'roadSafety';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Tree Plantation':
            key = 'treePlantation';
            bCount = act.saplingsPlanted || 0;
            break;
          case 'Important Days & Events':
            key = 'importantDays';
            bCount = 0;
            break;
          case 'Pledge':
            key = 'pledge';
            bCount = 0;
            break;
          case 'Rallies':
            key = 'rallies';
            bCount = act.distanceKm || 0;
            break;
          case 'Hosted Meetings':
            key = 'hostedMeetings';
            bCount = act.beneficiariesCount || 0;
            break;
          case 'Any Other':
            key = 'anyOther';
            pCount = act.programmesConducted || 0;
            vCount = act.volunteersParticipated || 0;
            bCount = act.beneficiaries || 0;
            break;
        }

        if (key) {
          const target = currentStats[key];

          // a. Programmes
          if (pCount > 0) {
            target.progs.total += pCount;
            target.progs.list.push({ ...contributorBase, value: pCount, label: `${pCount} Programmes` });
          }

          // b. Volunteers
          if (vCount > 0) {
            target.volunteers.total += vCount;
            target.volunteers.list.push({ ...contributorBase, value: vCount, label: `${vCount} Volunteers` });
          }

          // c. Beneficiaries
          if (bCount > 0) {
            target.beneficiaries.total += bCount;
            let suffix = 'Beneficiaries';
            if (key === 'bloodDonation') suffix = 'Units of Blood';
            if (key === 'treePlantation') suffix = 'Saplings Planted';
            if (key === 'rallies') suffix = 'KM Distance';
            target.beneficiaries.list.push({ ...contributorBase, value: bCount, label: `${bCount} ${suffix}` });
          }

          // d. College participation
          if (key !== 'anyOther') {
            if (pCount > 0 || vCount > 0 || bCount > 0) {
              target.colleges.total += 1;
              target.colleges.list.push({ ...contributorBase, value: 1, label: 'Participated' });
            }
          } else {
            const cCount = act.collegeParticipated || 0;
            if (cCount > 0) {
              target.colleges.total += cCount;
              target.colleges.list.push({ ...contributorBase, value: cCount, label: `${cCount} Colleges` });
            } else if (pCount > 0 || vCount > 0 || bCount > 0) {
              target.colleges.total += 1;
              target.colleges.list.push({ ...contributorBase, value: 1, label: '1 College' });
            }
          }
        }
      });
    });

    return { stats: currentStats, socialCounts: currentSocialCounts };
  }, [reports]);

  const handleDownload = async (id, type, collegeName, period) => {
    const key = `${id}-${type}`;
    setDownloadingId(key);
    try {
      const safeName = (collegeName || 'report').replace(/[^a-zA-Z0-9]/g, '_');
      const safePeriod = (period || '').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      await downloadFile(
        `/api/reports/${id}/export/${type}`,
        `NSS_Report_${safeName}_${safePeriod}.${ext}`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterDistrict.trim()) params.district = filterDistrict.trim();
      if (filterPeriod) params.reportingPeriod = filterPeriod;
      if (filterSubmissionId.trim()) params.submissionId = filterSubmissionId.trim();
      if (filterSubmissionDate) params.submissionDate = filterSubmissionDate;
      params.sort = sort;

      const res = await axios.get('/api/reports', { params });
      setReports(res.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [search, filterDistrict, filterPeriod, filterSubmissionId, filterSubmissionDate, sort]);

  useEffect(() => {
    fetchReports();
  }, [sort]); // auto-fetch on sort change

  const handleSearch = () => fetchReports();

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/reports/${id}`);
      toast.success('Report deleted');
      setReports(prev => prev.filter(r => r._id !== id));
    } catch {
      toast.error('Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id) => {
    setSelectedReportId(id);
    setDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterDistrict('');
    setFilterPeriod('');
    setFilterSubmissionId('');
    setFilterSubmissionDate('');
    setSort('newest');
  };

  const getActivityName = (activityKey) => {
    if (activityKey === 'social') return 'Social Media';
    switch (activityKey) {
      case 'specialCamps': return 'Special Camps Conducted';
      case 'bloodDonation': return 'Blood Donation Camps';
      case 'healthCamps': return 'No of Health Camps';
      case 'antiDrug': return 'Anti drug Camps';
      case 'votersSIR': return 'Voters Awareness (SIR)';
      case 'votersSVEEP': return 'Voters Awareness (SVEEP)';
      case 'roadSafety': return 'Road Safety';
      case 'treePlantation': return 'Tree Plantation';
      case 'importantDays': return 'Important Days & Events';
      case 'pledge': return 'Pledge';
      case 'rallies': return 'Rallies';
      case 'hostedMeetings': return 'Hosted Meetings';
      case 'anyOther': return 'Any Other';
      default: return activityKey;
    }
  };

  const getMetricName = (metricType) => {
    if (selectedCellActivity === 'social') {
      switch (metricType) {
        case 'instagram': return 'Instagram';
        case 'x': return 'X (Twitter)';
        case 'facebook': return 'Meta (Facebook)';
        case 'youtube': return 'YouTube';
        case 'other': return 'Other Platforms';
        default: return metricType;
      }
    }
    switch (metricType) {
      case 'progs': return 'Programmes Conducted';
      case 'colleges': return 'Colleges Participated';
      case 'volunteers': return 'NSS Volunteers';
      case 'beneficiaries': return 'Beneficiaries/Saplings/Units';
      default: return metricType;
    }
  };

  const getUnitSuffix = (activityKey) => {
    if (activityKey === 'bloodDonation') return ' (Units of Blood)';
    if (activityKey === 'treePlantation') return ' (Saplings)';
    if (activityKey === 'rallies') return ' (KMs)';
    return '';
  };

  const renderTableCell = (activityKey, metricType, showBorderRight = true) => {
    const data = stats[activityKey]?.[metricType];
    const total = data?.total || 0;
    const isClickable = total > 0;

    let displayValue = total;
    if (metricType === 'beneficiaries') {
      const suffix = getUnitSuffix(activityKey);
      if (suffix) {
        displayValue = `${total}${suffix}`;
      }
    }

    return (
      <TableCell
        align="center"
        onClick={isClickable ? () => handleCellClick(activityKey, metricType, data.list) : undefined}
        sx={{
          p: 1.5,
          fontSize: '0.75rem',
          borderRight: showBorderRight ? '1px solid #e0e0e0' : 'none',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
          ...(isClickable ? {
            fontWeight: 'bold',
            color: '#004aad',
            '&:hover': {
              bgcolor: '#e3f2fd', // Soft blue hover color for the entire cell
            }
          } : {
            color: 'text.secondary'
          })
        }}
      >
        {isClickable ? (
          <Tooltip title="Click to view details" arrow>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
              {displayValue}
            </Typography>
          </Tooltip>
        ) : (
          displayValue
        )}
      </TableCell>
    );
  };

  const renderSocialText = (platformKey) => {
    const data = socialCounts[platformKey];
    const total = data?.total || 0;
    if (total === 0) return <Typography component="span" variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>0</Typography>;

    return (
      <Tooltip title={`Click to view ${getMetricName(platformKey)} posts`} arrow>
        <Typography
          component="span"
          variant="body2"
          onClick={() => handleCellClick('social', platformKey, data.list)}
          sx={{
            mx: 0.5,
            fontWeight: 'bold',
            color: '#1b4ed9ff',
            cursor: 'pointer',

            '&:hover': {
              color: '#1b4ed9ff'
            }
          }}
        >
          {total}
        </Typography>
      </Tooltip>
    );
  };

  // Stats
  const totalReports = reports.length;

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Top Bar */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(90deg, #002f6c, #004aad)' }}>
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            NSS Quarterly Report — Admin Panel
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            size="small"
            startIcon={<ExitToApp />}
            onClick={logout}
            sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
          >
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
        {/* Stats Row */}
        <Grid container spacing={2} mb={3} sx={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', borderRadius: 2, boxShadow: 2, bgcolor: '#e8eaf6' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                  Total Submissions
                </Typography>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {totalReports}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', borderRadius: 2, boxShadow: 2, bgcolor: '#e8f5e9' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                  Showing Results
                </Typography>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {reports.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', borderRadius: 2, boxShadow: 2, bgcolor: '#fff3e0', height: '100%' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold" mb={0.5}>
                  Bulk Export (Filtered)
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={downloadingId === 'bulk' ? <CircularProgress size={14} color="inherit" /> : <DownloadForOffline />}
                    disabled={downloadingId !== null}
                    onClick={async () => {
                      setDownloadingId('bulk');
                      try {
                        const params = new URLSearchParams();
                        if (filterPeriod) params.set('reportingPeriod', filterPeriod);
                        if (filterDistrict) params.set('district', filterDistrict);
                        if (filterSubmissionId) params.set('submissionId', filterSubmissionId);
                        if (filterSubmissionDate) params.set('submissionDate', filterSubmissionDate);
                        await downloadFile(
                          `/api/reports/export/raw?${params.toString()}`,
                          'NSS_Raw_Data_Export.xlsx'
                        );
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  >
                    Raw Data
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={downloadingId === 'multi' ? <CircularProgress size={14} color="inherit" /> : <DownloadForOffline />}
                    disabled={downloadingId !== null}
                    onClick={async () => {
                      setDownloadingId('multi');
                      try {
                        const params = new URLSearchParams();
                        if (filterPeriod) params.set('reportingPeriod', filterPeriod);
                        if (filterDistrict) params.set('district', filterDistrict);
                        if (filterSubmissionId) params.set('submissionId', filterSubmissionId);
                        if (filterSubmissionDate) params.set('submissionDate', filterSubmissionDate);
                        await downloadFile(
                          `/api/reports/export/multi-sheet?${params.toString()}`,
                          'NSS_Multi_Sheet_Export.xlsx'
                        );
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  >
                    Multi-Sheet
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={downloadingId === 'bulk-pdf' ? <CircularProgress size={14} color="inherit" /> : <DownloadForOffline />}
                    disabled={downloadingId !== null}
                    onClick={async () => {
                      setDownloadingId('bulk-pdf');
                      try {
                        const params = new URLSearchParams();
                        if (filterPeriod) params.set('reportingPeriod', filterPeriod);
                        if (filterDistrict) params.set('district', filterDistrict);
                        if (filterSubmissionId) params.set('submissionId', filterSubmissionId);
                        if (filterSubmissionDate) params.set('submissionDate', filterSubmissionDate);
                        await downloadFile(
                          `/api/reports/export/bulk-pdf?${params.toString()}`,
                          'NSS_Bulk_Report_Export.pdf'
                        );
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    startIcon={downloadingId === 'cumulative-pdf' ? <CircularProgress size={14} color="inherit" /> : <DownloadForOffline />}
                    disabled={downloadingId !== null}
                    onClick={async () => {
                      setDownloadingId('cumulative-pdf');
                      try {
                        const params = new URLSearchParams();
                        if (filterPeriod) params.set('reportingPeriod', filterPeriod);
                        if (filterDistrict) params.set('district', filterDistrict);
                        if (filterSubmissionId) params.set('submissionId', filterSubmissionId);
                        if (filterSubmissionDate) params.set('submissionDate', filterSubmissionDate);
                        await downloadFile(
                          `/api/reports/export/cumulative-pdf?${params.toString()}`,
                          'NSS_Eventwise_Cumulative_Report.pdf'
                        );
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  >
                    Cumulative PDF
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Bar */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={2}>
              Search &amp; Filter Reports
            </Typography>
            <Grid container spacing={2.5}>
              {/* Row 1: Full-Width Reporting Period */}
              <Grid item xs={12} sx={{ width: "99%" }} >
                <FormControl fullWidth size="small">
                  <InputLabel id="filter-period-label">Reporting Period</InputLabel>
                  <Select
                    labelId="filter-period-label"
                    id="filter-period"
                    value={filterPeriod}
                    label="Reporting Period"
                    onChange={e => setFilterPeriod(e.target.value)}
                  >
                    <MenuItem value="">All Periods</MenuItem>
                    {REPORTING_PERIODS.map(p => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Row 2: Search by College/PO, Submission ID, Date, District and Buttons */}
              <Grid item xs={12} md={3.5}>
                <TextField
                  id="search-input"
                  label="Search by College or Programme Officer"
                  fullWidth
                  size="small"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search color="action" fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2.3}>
                <TextField
                  id="filter-submission-id"
                  label="Search by Submission ID"
                  fullWidth
                  size="small"
                  value={filterSubmissionId}
                  onChange={e => setFilterSubmissionId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search color="action" fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2.2}>
                <TextField
                  id="filter-submission-date"
                  label="Submission Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={filterSubmissionDate}
                  onChange={e => setFilterSubmissionDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  id="filter-district"
                  label="District"
                  fullWidth
                  size="small"
                  value={filterDistrict}
                  onChange={e => setFilterDistrict(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2} display="flex" justifyContent="flex-end" alignItems="center">
                <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button
                    id="search-btn"
                    variant="contained"
                    onClick={handleSearch}
                    startIcon={<Search />}
                    size="small"
                    sx={{ px: 2, flexGrow: { xs: 1, md: 0 } }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    sx={{ px: 2, flexGrow: { xs: 1, md: 0 } }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* Sort row */}
            <Box display="flex" justifyContent="flex-end" mt={2.5} gap={1.5} alignItems="center" sx={{ width: '100%' }} style={{ width: '30%', border: "1px solid #ccc", padding: "10px", marginTop: "20px" }} >
              <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ marginBottom: '5px' }} >Sort By:</Typography>
              <Chip
                label="Newest First"
                size="small"
                color={sort === 'newest' ? 'primary' : 'default'}
                onClick={() => setSort('newest')}
                clickable
                sx={{ fontWeight: sort === 'newest' ? 'bold' : 'normal', marginRight: "53px", borderRadius: '7px', padding: '18px', fontSize: '0.88rem' }}
              />
              <Chip
                label="Oldest First"
                size="small"
                color={sort === 'oldest' ? 'primary' : 'default'}
                onClick={() => setSort('oldest')}
                clickable
                sx={{ fontWeight: sort === 'oldest' ? 'bold' : 'normal', borderRadius: '7px', padding: '18px', fontSize: '0.88rem' }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Event-wise Cumulative Dashboard */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h6" fontWeight="bold" color="primary" sx={{ m: 0 }}>
                Event-wise Cumulative Dashboard (Real-time)
              </Typography>
              <Chip label="Interactive Grid" color="primary" size="small" variant="filled" sx={{ fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} />
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDashboard(!showDashboard)}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
            </Button>
          </Box>

          {showDashboard && (
            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} sx={{ maxHeight: 600, overflowX: 'auto', borderRadius: 0, boxShadow: 'none' }}>
                <Table size="small" stickyHeader sx={{ borderCollapse: 'separate' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>S.No</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', minWidth: 220, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Subject</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Special Camps Conducted</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Blood Donation Camps</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>No of Health Camps</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Anti Drug Camps</TableCell>
                      <TableCell colSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Voters Awareness</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Road Safety</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Tree Plantation</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 120, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Important Days & Events</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Pledge</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Rallies</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Hosted Meetings</TableCell>
                      <TableCell rowSpan={2} sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', minWidth: 100, fontSize: '0.75rem', p: 1 }}>Any Other</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '0.7rem', p: 0.5, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>SIR</TableCell>
                      <TableCell sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '0.7rem', p: 0.5, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>SVEEP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Row 1 */}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>1</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>No. Of Programmes Conducted</TableCell>
                      {renderTableCell('specialCamps', 'progs')}
                      {renderTableCell('bloodDonation', 'progs')}
                      {renderTableCell('healthCamps', 'progs')}
                      {renderTableCell('antiDrug', 'progs')}
                      {renderTableCell('votersSIR', 'progs')}
                      {renderTableCell('votersSVEEP', 'progs')}
                      {renderTableCell('roadSafety', 'progs')}
                      {renderTableCell('treePlantation', 'progs')}
                      {renderTableCell('importantDays', 'progs')}
                      {renderTableCell('pledge', 'progs')}
                      {renderTableCell('rallies', 'progs')}
                      {renderTableCell('hostedMeetings', 'progs')}
                      {renderTableCell('anyOther', 'progs', false)}
                    </TableRow>

                    {/* Row 2 */}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>2</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>No of College Participated</TableCell>
                      {renderTableCell('specialCamps', 'colleges')}
                      {renderTableCell('bloodDonation', 'colleges')}
                      {renderTableCell('healthCamps', 'colleges')}
                      {renderTableCell('antiDrug', 'colleges')}
                      {renderTableCell('votersSIR', 'colleges')}
                      {renderTableCell('votersSVEEP', 'colleges')}
                      {renderTableCell('roadSafety', 'colleges')}
                      {renderTableCell('treePlantation', 'colleges')}
                      {renderTableCell('importantDays', 'colleges')}
                      {renderTableCell('pledge', 'colleges')}
                      {renderTableCell('rallies', 'colleges')}
                      {renderTableCell('hostedMeetings', 'colleges')}
                      {renderTableCell('anyOther', 'colleges', false)}
                    </TableRow>

                    {/* Row 3 */}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>3</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>No. of NSS Volunteers Participated</TableCell>
                      {renderTableCell('specialCamps', 'volunteers')}
                      {renderTableCell('bloodDonation', 'volunteers')}
                      {renderTableCell('healthCamps', 'volunteers')}
                      {renderTableCell('antiDrug', 'volunteers')}
                      {renderTableCell('votersSIR', 'volunteers')}
                      {renderTableCell('votersSVEEP', 'volunteers')}
                      {renderTableCell('roadSafety', 'volunteers')}
                      {renderTableCell('treePlantation', 'volunteers')}
                      {renderTableCell('importantDays', 'volunteers')}
                      {renderTableCell('pledge', 'volunteers')}
                      {renderTableCell('rallies', 'volunteers')}
                      {renderTableCell('hostedMeetings', 'volunteers')}
                      {renderTableCell('anyOther', 'volunteers', false)}
                    </TableRow>

                    {/* Row 4 */}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>4</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>Beneficiaries</TableCell>
                      {renderTableCell('specialCamps', 'beneficiaries')}
                      {renderTableCell('bloodDonation', 'beneficiaries')}
                      {renderTableCell('healthCamps', 'beneficiaries')}
                      {renderTableCell('antiDrug', 'beneficiaries')}
                      {renderTableCell('votersSIR', 'beneficiaries')}
                      {renderTableCell('votersSVEEP', 'beneficiaries')}
                      {renderTableCell('roadSafety', 'beneficiaries')}
                      {renderTableCell('treePlantation', 'beneficiaries')}
                      {renderTableCell('importantDays', 'beneficiaries')}
                      {renderTableCell('pledge', 'beneficiaries')}
                      {renderTableCell('rallies', 'beneficiaries')}
                      {renderTableCell('hostedMeetings', 'beneficiaries')}
                      {renderTableCell('anyOther', 'beneficiaries', false)}
                    </TableRow>

                    {/* Row 5 */}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.75rem', p: 1, borderRight: '1px solid #e0e0e0' }}>5</TableCell>
                      <TableCell colSpan={14} sx={{ p: 1.5 }}>
                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
                          <Typography variant="body2" component="span" fontWeight="bold">
                            NSS Events social media links:
                          </Typography>
                          <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
                            <Box display="flex" alignItems="center">
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>1. Instagram:</Typography>
                              {renderSocialText('instagram')}
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>2. X (Twitter):</Typography>
                              {renderSocialText('x')}
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>3. Meta (Facebook):</Typography>
                              {renderSocialText('facebook')}
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>4. YouTube:</Typography>
                              {renderSocialText('youtube')}
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>5. Any other:</Typography>
                              {renderSocialText('other')}
                            </Box>
                          </Stack>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          )}
        </Card>

        {/* Reports Table */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : reports.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No reports found. Try adjusting your filters.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>

            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#002f6c' }}>
                  {['S.No', 'Submission ID', 'College Name', 'Programme Officer', 'District', 'Reporting Period', 'Submitted Date', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold', py: 1.5, fontSize: 12 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r, idx) => (
                  <TableRow key={r._id} hover sx={{ bgcolor: idx % 2 === 0 ? '#f8faff' : '#fff' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: 12 }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.submissionId}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 180 }}>
                      {r.collegeName}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {r.programmeOfficerName}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {r.district}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      <Chip label={r.reportingPeriod} size="small" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View / Edit Report">
                          <IconButton
                            id={`view-${r._id}`}
                            size="small"
                            color="primary"
                            onClick={() => handleView(r._id)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <span>
                            <IconButton
                              id={`pdf-${r._id}`}
                              size="small"
                              color="error"
                              disabled={downloadingId === `${r._id}-pdf`}
                              onClick={() => handleDownload(r._id, 'pdf', r.collegeName, r.reportingPeriod)}
                            >
                              {downloadingId === `${r._id}-pdf`
                                ? <CircularProgress size={16} />
                                : <PictureAsPdf fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Download Excel">
                          <span>
                            <IconButton
                              id={`excel-${r._id}`}
                              size="small"
                              color="success"
                              disabled={downloadingId === `${r._id}-excel`}
                              onClick={() => handleDownload(r._id, 'excel', r.collegeName, r.reportingPeriod)}
                            >
                              {downloadingId === `${r._id}-excel`
                                ? <CircularProgress size={16} />
                                : <GridOn fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete Report">
                          <IconButton
                            id={`delete-${r._id}`}
                            size="small"
                            color="error"
                            onClick={() => handleDelete(r._id)}
                            disabled={deletingId === r._id}
                          >
                            {deletingId === r._id
                              ? <CircularProgress size={16} />
                              : <Delete fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Cumulative Cell Details Dialog */}
      <Dialog
        open={cellDialogOpen}
        onClose={() => setCellDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#002f6c', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Contribution Details: {getActivityName(selectedCellActivity)} — {getMetricName(selectedCellMetric)}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {selectedCellContributors.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>No contributions found.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none', maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>College Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>District</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Programme Officer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Value Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCellContributors.map((c, idx) => (
                    <TableRow key={c.reportId + idx} hover>
                      <TableCell sx={{ py: 1 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500, py: 1 }}>{c.collegeName}</TableCell>
                      <TableCell sx={{ py: 1 }}>{c.district}</TableCell>
                      <TableCell sx={{ py: 1 }}>{c.poName}</TableCell>
                      <TableCell sx={{ py: 1 }}>
                        {selectedCellActivity === 'social' ? (
                          <a
                            href={c.value.startsWith('http') ? c.value : `https://${c.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              wordBreak: 'break-all',
                              color: '#004aad',
                              textDecoration: 'underline',
                              fontWeight: 'bold'
                            }}
                          >
                            {c.value}
                          </a>
                        ) : (
                          <Chip label={c.label} size="small" variant="filled" color="primary" sx={{ fontWeight: 'bold' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', py: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => {
                            setCellDialogOpen(false);
                            handleView(c.reportId);
                          }}
                          sx={{ textTransform: 'none', py: 0.5 }}
                        >
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setCellDialogOpen(false)} variant="outlined" color="primary" sx={{ fontWeight: 'bold', textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        reportId={selectedReportId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUpdated={fetchReports}
      />
    </Box>
  );
}
