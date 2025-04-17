import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog, // Import Dialog components
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Example icon for client
import GavelIcon from '@mui/icons-material/Gavel'; // Example icon for lawyer
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete icon

function MatterDetailPage() {
  const { id: matterId } = useParams();
  const navigate = useNavigate();
  const [matter, setMatter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for dialog
  const [isDeleting, setIsDeleting] = useState(false); // State for delete loading

  useEffect(() => {
    const fetchMatterDetails = async () => {
      if (!matterId) {
        setError('Matter ID not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosInstance.get(`/matters/${matterId}`);
        setMatter(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to load matter details: ${message}`);
        console.error('Fetch matter details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatterDetails();
  }, [matterId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Closed': return 'error';
      default: return 'default';
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleDeleteMatter = async () => {
    handleCloseConfirmDialog();
    setIsDeleting(true);
    setError('');

    try {
      await axiosInstance.delete(`/matters/${matterId}`);
      console.log('Matter deleted successfully');
      navigate('/matters', { replace: true, state: { message: 'Matter deleted successfully.' } });
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to delete matter: ${message}`);
      console.error('Delete matter error:', err);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error && !isDeleting) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!matter) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">Matter data not found.</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {error && isDeleting && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {matter.title}
            </Typography>
            <Chip label={matter.status} color={getStatusColor(matter.status)} size="small" sx={{ mr: 1 }} />
            <Typography variant="overline" display="inline">
              Docket: {matter.docketNumber} (Category: {matter.category})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={RouterLink}
              to={`/matters/edit/${matterId}`}
              variant="outlined"
              size="small"
              disabled={isDeleting}
            >
              Edit Matter
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleOpenConfirmDialog}
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid xs={12}>
            <Typography variant="h6" gutterBottom>Client</Typography>
            {matter.client ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography
                  component={RouterLink}
                  to={`/clients/${matter.client._id}`}
                  variant="body1"
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {matter.client.name}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">N/A</Typography>
            )}
          </Grid>

          <Grid xs={12}>
            <Typography variant="h6" gutterBottom>Assigned Team</Typography>
            {matter.teamAssigned && matter.teamAssigned.length > 0 ? (
              <List dense disablePadding>
                {matter.teamAssigned.map(lawyer => (
                  <ListItem key={lawyer._id} disableGutters sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                      <GavelIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          component={RouterLink}
                          to={`/lawyers/${lawyer._id}`}
                          variant="body2"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {`${lawyer.name} (${lawyer.initials})`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">No lawyers assigned</Typography>
            )}
          </Grid>

          <Grid xs={12}>
            <Typography variant="h6" gutterBottom>Description / Notes</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
              {matter.relevantData || 'No description provided.'}
            </Typography>
          </Grid>

          <Grid xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(matter.createdAt).toLocaleString()} |
              Last Updated: {new Date(matter.updatedAt).toLocaleString()} by {matter.lastUpdatedBy?.name || 'System'} |
              Last Change: {matter.lastChangeDescription || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mt: 3 }}
        disabled={isDeleting}
      >
        Back
      </Button>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the matter "{matter?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteMatter} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Activity Log Section --- */}
      <Paper sx={{ mt: 5, p: 3 }}>
        <Typography variant="h6" gutterBottom>Activity Log</Typography>
        <MatterActivityLog matterId={matterId} />
      </Paper>
    </Container>
  );
}

function MatterActivityLog({ matterId }) {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setLoading(true);
    setError('');
    axiosInstance.get(`/time-entries/matter/${matterId}`)
      .then(res => setEntries(res.data))
      .catch(err => setError('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, [matterId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={22} /></Box>;
  if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  if (!entries.length) return <Typography color="text.secondary" sx={{ my: 2 }}>No activities logged for this matter yet.</Typography>;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Lawyer</th>
            <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Time Spent (hrs)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry._id}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{new Date(entry.date).toLocaleDateString()}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{entry.lawyerInitials}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{entry.description}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{entry.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export default MatterDetailPage;
