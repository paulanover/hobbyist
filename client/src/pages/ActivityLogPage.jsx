import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Typography, Box, CircularProgress, Button
} from '@mui/material';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Filter input states (controlled by user typing)
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [matterFilter, setMatterFilter] = useState('');
  // Applied filter states (only updated on Search)
  const [appliedFilters, setAppliedFilters] = useState({ search: '', client: '', matter: '' });

  // Fetch logs for the selected month (called on Search)
  async function fetchLogsForMonth(selectedMonth) {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/audit-logs?month=${selectedMonth}`);
      console.log('API response:', res.data);
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      } else if (Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setError('Failed to fetch activity logs.');
      setLogs([]);
    }
    setLoading(false);
  }

  // No useEffect for logs fetch. Fetching is now manual on Search.

  return (
    <Box maxWidth={900} mx="auto" my={4} p={3} component={Paper} elevation={3} borderRadius={2}>
      <Typography variant="h5" mb={2} fontWeight={700}>Firm Activity Log</Typography>
      <Box component="form" display="flex" gap={2} mb={2} flexWrap="wrap" onSubmit={async e => {
        e.preventDefault();
        setAppliedFilters({ search, client: clientFilter, matter: matterFilter });
        await fetchLogsForMonth(month);
      }}>
        <TextField
          label="Month"
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Search activity log"
          placeholder="Enter keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setAppliedFilters({ search, client: clientFilter, matter: matterFilter }); } }}
        />
        <TextField
          label="Client"
          placeholder="Filter by client title"
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          sx={{ minWidth: 180 }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setAppliedFilters({ search, client: clientFilter, matter: matterFilter }); } }}
        />
        <TextField
          label="Matter"
          placeholder="Filter by matter title"
          value={matterFilter}
          onChange={e => setMatterFilter(e.target.value)}
          sx={{ minWidth: 180 }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setAppliedFilters({ search, client: clientFilter, matter: matterFilter }); } }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ height: 40, alignSelf: 'center', fontWeight: 600, px: 4 }}
        >
          Search
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" my={2}>{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Lawyer Initials</TableCell>
                <TableCell>Action Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Entity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No activity found for this month.</TableCell>
                </TableRow>
              ) : (
                logs.filter(log => {
                  const s = (appliedFilters.search || '').trim().toLowerCase();
                  const c = (appliedFilters.client || '').trim().toLowerCase();
                  const m = (appliedFilters.matter || '').trim().toLowerCase();
                  // All filters must match
                  const matchesSearch = !s || (
                    (log.lawyerInitials || '').toLowerCase().includes(s) ||
                    (log.action_type || '').toLowerCase().includes(s) ||
                    (log.description || '').toLowerCase().includes(s) ||
                    (log.entity_type || '').toLowerCase().includes(s)
                  );
                  const matchesClient = !c || (log.clientTitle || '').toLowerCase().includes(c);
                  const matchesMatter = !m || (log.matterTitle || '').toLowerCase().includes(m);
                  return matchesSearch && matchesClient && matchesMatter;
                }).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No activity matches your search.</TableCell>
                  </TableRow>
                ) : (
                  logs.filter(log => {
                    const s = (appliedFilters.search || '').trim().toLowerCase();
                    const c = (appliedFilters.client || '').trim().toLowerCase();
                    const m = (appliedFilters.matter || '').trim().toLowerCase();
                    const matchesSearch = !s || (
                      (log.lawyerInitials || '').toLowerCase().includes(s) ||
                      (log.action_type || '').toLowerCase().includes(s) ||
                      (log.description || '').toLowerCase().includes(s) ||
                      (log.entity_type || '').toLowerCase().includes(s)
                    );
                    const matchesClient = !c || (log.clientTitle || '').toLowerCase().includes(c);
                    const matchesMatter = !m || (log.matterTitle || '').toLowerCase().includes(m);
                    return matchesSearch && matchesClient && matchesMatter;
                  }).map((log) => (
                    <TableRow key={log.id || log._id || log.created_at + log.action_type}>
                      <TableCell>{(() => {
  const dateVal = log.created_at || log.createdAt;
  const d = dateVal ? new Date(dateVal) : null;
  if (!d || isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString();
})()}</TableCell>
                      <TableCell>{log.lawyerInitials}</TableCell>
                      <TableCell>{log.action_type}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.entity_type || ''}</TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ActivityLogPage;
