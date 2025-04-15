// filepath: /Users/pwa/PERSONAL PROJECT/law-office-system/client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Alert, Grid, Paper } from '@mui/material';
import axiosInstance from '../api/axiosConfig'; // Use the configured axios instance

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log('[DashboardPage] Attempting to fetch dashboard data...'); // Log fetch attempt
      try {
        // Assuming your backend route for basic stats is /api/matters/dashboard/basic
        const response = await axiosInstance.get('/matters/dashboard/basic');
        console.log('[DashboardPage] Data fetched successfully:', response.data); // Log success
        setStats(response.data);
      } catch (err) {
        // Log the detailed error
        console.error('[DashboardPage] Error fetching data:', err.response?.data || err.message);
        // Set a user-friendly error message based on the response
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
        setStats(null); // Clear stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means run once on mount

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Display the specific error message from the state */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} {/* Display the error message */}
        </Alert>
      )}

      {stats && !loading && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid xs={12} sm={6} md={3}> {/* Changed: Removed 'item' prop */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Total Matters</Typography>
              <Typography variant="h4">{stats.totalMatters ?? 'N/A'}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} sm={6} md={3}> {/* Changed: Removed 'item' prop */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Active Matters</Typography>
              <Typography variant="h4">{stats.activeMatters ?? 'N/A'}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} sm={6} md={3}> {/* Changed: Removed 'item' prop */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Total Clients</Typography>
              <Typography variant="h4">{stats.totalClients ?? 'N/A'}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} sm={6} md={3}> {/* Changed: Removed 'item' prop */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Active Lawyers</Typography>
              <Typography variant="h4">{stats.activeLawyers ?? 'N/A'}</Typography>
            </Paper>
          </Grid>
          {/* Add more stats cards as needed */}
        </Grid>
      )}
    </Box>
  );
}

export default DashboardPage;