import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Container,
  Card, CardContent, Grid, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Stack, Tooltip, Alert, InputAdornment
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
