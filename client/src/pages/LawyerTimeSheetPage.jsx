import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper, Grid } from '@mui/material';
import axios from '../api/axiosConfig';

const LawyerTimeSheetPage = () => {
  const [filters, setFilters] = useState({ client: '', matter: '', lawyer: '', dateFrom: '', dateTo: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const res = await axios.get('/lts', { params });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch report');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Lawyer Time Sheet Report</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Client" name="client" value={filters.client} onChange={handleChange} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Matter" name="matter" value={filters.matter} onChange={handleChange} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField label="Lawyer Initials" name="lawyer" value={filters.lawyer} onChange={handleChange} fullWidth size="small" />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Date From" name="dateFrom" type="date" value={filters.dateFrom} onChange={handleChange} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Date To" name="dateTo" type="date" value={filters.dateTo} onChange={handleChange} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={12} md={12}>
            <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading} sx={{ mt: { xs: 2, md: 0 } }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Client Name</TableCell>
              <TableCell>Docket Number</TableCell>
              <TableCell>Matter Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Lawyer Initials</TableCell>
              <TableCell>Time Spent (hrs)</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} align="center">No results</TableCell></TableRow>
            )}
            {results.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.clientName}</TableCell>
                <TableCell>{row.docketNumber}</TableCell>
                <TableCell>{row.matterTitle}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.lawyerInitials}</TableCell>
                <TableCell>{row.timeSpent}</TableCell>
                <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default LawyerTimeSheetPage;
