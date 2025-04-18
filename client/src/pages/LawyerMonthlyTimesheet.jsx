import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Box, Typography, CircularProgress, Alert, Paper, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

function getMonthOptions() {
  // Always include the current month as the first option
  const now = new Date();
  const months = [];
  const seen = new Set();
  // Add current month
  const currentValue = now.toISOString().slice(0, 7);
  const currentLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  months.push({ value: currentValue, label: currentLabel });
  seen.add(currentValue);
  // Add previous 11 months
  for (let i = 1; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7); // YYYY-MM
    if (!seen.has(value)) {
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({ value, label });
      seen.add(value);
    }
  }
  return months;
}

export default function LawyerMonthlyTimesheet() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    axiosInstance.get(`/time-entries/my?month=${month}`)
      .then(res => {
        setEntries(res.data);
        console.log('[LawyerMonthlyTimesheet] API response:', res.data);
      })
      .catch(() => setError('Failed to load timesheet'))
      .finally(() => setLoading(false));
  }, [month]);

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

  return (
    <Box maxWidth={700} mx="auto" mt={5}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>My Monthly Timesheet</Typography>
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="month-select-label">Month</InputLabel>
          <Select
            labelId="month-select-label"
            value={month}
            label="Month"
            onChange={e => setMonth(e.target.value)}
          >
            {getMonthOptions().map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size={22} /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : !entries.length ? (
          <Typography color="text.secondary" sx={{ my: 2 }}>No time entries for this month.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Matter</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Time Spent (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry._id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{new Date(entry.date).toLocaleDateString()}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{entry.matter?.title || '—'}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{entry.description}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{entry.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Typography sx={{ mt: 2, textAlign: 'right', fontWeight: 600 }}>Total: {totalHours.toFixed(2)} hours</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
