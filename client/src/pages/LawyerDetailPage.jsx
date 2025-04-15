import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Button,
} from '@mui/material';

function LawyerDetailPage() {
  const { id: lawyerId } = useParams();
  const [lawyerData, setLawyerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLawyerDetails = async () => {
      if (!lawyerId) {
        setError('Lawyer ID not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Use the new backend endpoint
        const { data } = await axiosInstance.get(`/lawyers/${lawyerId}/details`);
        setLawyerData(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to load lawyer details: ${message}`);
        console.error('Fetch lawyer details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerDetails();
  }, [lawyerId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Closed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!lawyerData || !lawyerData.lawyerDetails) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">Lawyer data not found.</Alert></Container>;
  }

  const { lawyerDetails, assignedMatters } = lawyerData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                {lawyerDetails.name} ({lawyerDetails.initials})
                </Typography>
                <Chip label={lawyerDetails.status} color={lawyerDetails.status === 'Active' ? 'success' : 'default'} size="small" sx={{ mb: 1 }} />
            </Box>
             {/* Optional: Add Edit button for Admins */}
             {/* <Button component={RouterLink} to={`/lawyers/edit/${lawyerId}`} variant="outlined" size="small">Edit Profile</Button> */}
        </Box>


        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1"><strong>Rank:</strong> {lawyerDetails.rank}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1"><strong>Email:</strong> {lawyerDetails.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1"><strong>Address:</strong> {lawyerDetails.address || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Assigned Matters ({assignedMatters?.length || 0})
      </Typography>

      {assignedMatters && assignedMatters.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="assigned matters table">
            <TableHead>
              <TableRow>
                <TableCell>Matter Title</TableCell>
                <TableCell>Docket #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedMatters.map((matter) => (
                <TableRow key={matter._id}>
                  <TableCell>
                    {/* Optional: Link to matter detail page if it exists */}
                    {matter.title}
                  </TableCell>
                  <TableCell>{matter.docketNumber}</TableCell>
                  <TableCell>{matter.client?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={matter.status} color={getStatusColor(matter.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(matter.dateCreated).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ mt: 2 }}>This lawyer is not currently assigned to any matters.</Typography>
      )}
       <Button variant="outlined" onClick={() => window.history.back()} sx={{ mt: 3 }}>
            Back
       </Button>
    </Container>
  );
}

export default LawyerDetailPage;
