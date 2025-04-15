import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig'; // Use the configured axios instance
import { Link as RouterLink } from 'react-router-dom'; // Import Link for navigation
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Button, // Import Button
  Box,
  IconButton, // Import IconButton
  Tooltip,    // Import Tooltip
  Chip,       // Import Chip for status display
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Import Edit icon

function LawyerListPage() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLawyers = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('Fetching lawyers...'); // Add log
        const { data } = await axiosInstance.get('/lawyers'); // Use relative path
        console.log('Lawyers fetched:', data); // Add log
        setLawyers(data);
      } catch (err) {
        const message =
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : err.message;
        setError(`Failed to fetch lawyers: ${message}`);
        console.error('Fetch lawyers error:', message);
        console.error('Fetch lawyers error details:', err.response || err); // Log detailed error
        // Handle token expiry or invalid token specifically if needed
        if (err.response && err.response.status === 401) {
            // Optionally redirect to login or show specific message
            setError('Session expired or invalid. Please log in again.');
            // Consider clearing local storage here
            // localStorage.removeItem('userInfo');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []); // Empty dependency array means this runs once on mount

  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Lawyer Directory
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/lawyers/add"
        >
          Add Lawyer
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 1100 }} aria-label="lawyers table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Initials</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated At</TableCell>
                <TableCell>Last Updated By</TableCell>
                <TableCell>Last Change</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lawyers.length === 0 ? (
                 <TableRow><TableCell colSpan={9} align="center">No lawyers found.</TableCell></TableRow>
              ) : (
                lawyers.map((lawyer) => (
                  <TableRow
                    key={lawyer._id}
                    sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        ...(lawyer.status === 'Inactive' && {
                          opacity: 0.65, // Make inactive rows slightly faded
                          backgroundColor: 'transparent', // Ensure background is transparent
                        }),
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography
                        component={RouterLink}
                        to={`/lawyers/${lawyer._id}`} // Link to detail page
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {lawyer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{lawyer.initials}</TableCell>
                    <TableCell>{lawyer.email}</TableCell>
                    <TableCell>{lawyer.rank}</TableCell>
                    <TableCell>
                      <Chip
                        label={lawyer.status}
                        color={getStatusColor(lawyer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(lawyer.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>{lawyer.lastUpdatedBy?.name || 'N/A'}</TableCell>
                    <TableCell>{lawyer.lastChangeDescription || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Lawyer">
                        <IconButton
                          component={RouterLink}
                          to={`/lawyers/edit/${lawyer._id}`}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default LawyerListPage;
