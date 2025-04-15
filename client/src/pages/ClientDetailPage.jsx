import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../api/axiosConfig';
// Import useNavigate and Link
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

// Helper component for displaying a list of matters
const MatterListSection = ({ title, matters }) => {
  if (!matters || matters.length === 0) {
    return null; // Don't render section if no matters
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Closed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom>
        {title} ({matters.length})
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small" aria-label={`${title} matters table`}>
          <TableHead>
            <TableRow>
              <TableCell>Docket #</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matters.map((matter) => (
              <TableRow key={matter._id}>
                <TableCell>
                  <Typography
                    component={RouterLink}
                    to={`/matters/${matter._id}`}
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {matter.docketNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    component={RouterLink}
                    to={`/matters/${matter._id}`}
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {matter.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  {matter.teamAssigned?.map(lawyer => lawyer.initials).join(', ') || 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip label={matter.status} color={getStatusColor(matter.status)} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};


function ClientDetailPage() {
  const { id: clientId } = useParams();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) {
        setError('Client ID not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosInstance.get(`/clients/${clientId}/details`);
        setClientData(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        // SECURITY: Consider logging less verbose errors to the console in production.
        // Send detailed errors to a dedicated logging service instead.
        // Ensure backend 'message' doesn't leak sensitive info.
        setError(`Failed to load client details: ${message}`);
        console.error('Fetch client details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  // Group matters by status once data is loaded
  const groupedMatters = useMemo(() => {
    if (!clientData?.associatedMatters) {
      return { active: [], inactive: [], closed: [] };
    }
    return clientData.associatedMatters.reduce((acc, matter) => {
      const status = matter.status?.toLowerCase() || 'inactive'; // Default to inactive if status missing
      if (status === 'active') acc.active.push(matter);
      else if (status === 'inactive') acc.inactive.push(matter);
      else if (status === 'closed') acc.closed.push(matter);
      return acc;
    }, { active: [], inactive: [], closed: [] });
  }, [clientData]);


  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!clientData || !clientData.clientDetails) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">Client data not found.</Alert></Container>;
  }

  const { clientDetails } = clientData;

  // SECURITY: Fetch user roles/permissions to conditionally render sensitive actions.
  // const canEditClient = checkUserPermission('editClient'); // Example function

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Client Details Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {clientDetails.name}
            </Typography>
            <Chip label={clientDetails.isBusinessEntity ? 'Business Entity' : 'Individual'} size="small" sx={{ mr: 1 }} />
            <Chip label={clientDetails.vatStatus} size="small" variant="outlined" />
          </Box>
          {/* SECURITY: Conditionally render the Edit button based on user permissions */}
          {/* {canEditClient && ( */}
            <Button component={RouterLink} to={`/clients/edit/${clientId}`} variant="outlined" size="small">Edit Client</Button>
          {/* )} */}
        </Box>

        <Grid container spacing={2}>
          {clientDetails.isBusinessEntity && (
            <>
              <Grid xs={12} md={6}>
                <Typography variant="body1"><strong>President:</strong> {clientDetails.presidentName || 'N/A'}</Typography>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body1"><strong>Representative:</strong> {clientDetails.authorizedRepresentative || 'N/A'}</Typography>
              </Grid>
            </>
          )}
          <Grid xs={12} md={6}>
            <Typography variant="body1"><strong>Email:</strong> {clientDetails.email || 'N/A'}</Typography>
          </Grid>
          <Grid xs={12} md={6}>
            <Typography variant="body1"><strong>Phone:</strong> {clientDetails.phone || 'N/A'}</Typography>
          </Grid>
          <Grid xs={12}>
            <Typography variant="body1"><strong>Address:</strong> {clientDetails.address || 'N/A'}</Typography>
          </Grid>
          <Grid xs={12}>
             <Typography variant="body1"><strong>Lawyer Owner(s):</strong></Typography>
             {clientDetails.lawyerOwners && clientDetails.lawyerOwners.length > 0 ? (
                <List dense disablePadding>
                    {clientDetails.lawyerOwners.map(owner => (
                        <ListItem key={owner._id} disableGutters sx={{py: 0}}>
                            <ListItemText primary={`${owner.name} (${owner.initials})`} />
                        </ListItem>
                    ))}
                </List>
             ) : (
                <Typography variant="body2" color="text.secondary">N/A</Typography>
             )}
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Matters Sections */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        Associated Matters
      </Typography>

      <MatterListSection title="Active Matters" matters={groupedMatters.active} />
      <MatterListSection title="Inactive Matters" matters={groupedMatters.inactive} />
      <MatterListSection title="Closed Matters" matters={groupedMatters.closed} />

      {(groupedMatters.active.length === 0 && groupedMatters.inactive.length === 0 && groupedMatters.closed.length === 0) && (
         <Typography sx={{ mt: 2 }}>This client has no associated matters.</Typography>
      )}


      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 3 }}>
        Back
      </Button>
    </Container>
  );
}

export default ClientDetailPage;
