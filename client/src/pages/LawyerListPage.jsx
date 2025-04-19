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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Import Edit icon
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete icon
import { useAuth } from '../context/AuthContext';

function LawyerListPage() {
  const { userInfo } = useAuth() || {};
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [lawyerToDelete, setLawyerToDelete] = useState(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");
  // --- Delete dialog logic ---
  const handleDelete = (lawyer) => {
    setLawyerToDelete(lawyer);
    setOpenDeleteDialog(true);
    setConfirmDeleteInput('');
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/lawyers/${lawyerToDelete._id}`);
      setLawyers(lawyers.filter((l) => l._id !== lawyerToDelete._id));
      setOpenDeleteDialog(false);
      setLawyerToDelete(null);
    } catch (err) {
      console.error('Failed to delete lawyer:', err);
      setError('Failed to delete lawyer.');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setLawyerToDelete(null);
    setConfirmDeleteInput('');
  };


  useEffect(() => {
    const fetchLawyers = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('Fetching lawyers...'); // Add log
        const { data } = await axiosInstance.get('/lawyers'); // Use relative path
        // Filter out soft-deleted lawyers
        const activeLawyers = Array.isArray(data) ? data.filter(l => !l.isDeleted) : [];
        setLawyers(activeLawyers);
        console.log('Lawyers fetched:', activeLawyers); // Add log
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
        <TableContainer component={Paper} sx={{
          width: '100%',
          overflowX: 'auto',
          '@media (max-width:600px)': {
            boxShadow: 'none',
            minWidth: 0,
          }
        }}>
          <Table sx={{ minWidth: 600 }} aria-label="lawyers table">
            <TableHead>
              <TableRow sx={{
                '@media (max-width:600px)': {
                  '& th': { fontSize: '0.85rem', padding: '6px 4px' }
                }
              }}>
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
                        '@media (max-width:600px)': {
                          '& td': { fontSize: '0.80rem', padding: '6px 4px' }
                        }
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
                    <TableCell sx={{ wordBreak: 'break-all' }}>{lawyer.email}</TableCell>
                    <TableCell>{lawyer.rank}</TableCell>
                    <TableCell>
                      <Chip
                        label={lawyer.status}
                        color={getStatusColor(lawyer.status)}
                        size="small"
                        sx={{
                          '@media (max-width:600px)': { fontSize: '0.7rem', height: 20 }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(lawyer.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>{lawyer.lastUpdatedBy?.name || 'N/A'}</TableCell>
                    <TableCell>{lawyer.lastChangeDescription || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 70 }}>
                      <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        alignItems: { xs: 'flex-end', sm: 'center' },
                        justifyContent: 'flex-end'
                      }}>
                        {userInfo && (
                          userInfo.role === 'admin'
                          || (
                            userInfo.role === 'lawyer'
                            && ['Partner', 'Junior Partner'].includes(userInfo.lawyerProfile?.rank)
                            && ['Associate', 'Senior Associate'].includes(lawyer.rank)
                          )
                        ) && (
                          <Tooltip title="Edit Lawyer">
                            <IconButton
                              component={RouterLink}
                              to={`/lawyers/edit/${lawyer._id}`}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Lawyer">
                          <IconButton
                            onClick={() => handleDelete(lawyer)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Lawyer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {lawyerToDelete?.name}? This action cannot be undone.<br/>
            <b>Type <code>delete</code> to confirm.</b>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'delete' to confirm"
            fullWidth
            value={confirmDeleteInput}
            onChange={e => setConfirmDeleteInput(e.target.value)}
            disabled={loading}
            error={confirmDeleteInput && confirmDeleteInput !== 'delete'}
            helperText={confirmDeleteInput && confirmDeleteInput !== 'delete' ? "You must type 'delete' to enable deletion." : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={confirmDeleteInput !== 'delete' || loading}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LawyerListPage;
