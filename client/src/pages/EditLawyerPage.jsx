import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';

// Define ranks and statuses matching the backend model
const lawyerRanks = ['Partner', 'Junior Partner', 'Senior Associate', 'Associate'];
const lawyerStatuses = ['Active', 'Inactive'];

function EditLawyerPage() {
  const { id: lawyerId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rank, setRank] = useState('');
  const [status, setStatus] = useState(''); // Add state for status
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Fetch existing lawyer data
  useEffect(() => {
    const fetchLawyerData = async () => {
      if (!lawyerId) return;
      setLoadingInitialData(true);
      setError('');
      try {
        const { data } = await axiosInstance.get(`/lawyers/${lawyerId}`);
        setName(data.name);
        setInitials(data.initials);
        setEmail(data.email);
        setAddress(data.address || '');
        setRank(data.rank);
        setStatus(data.status); // Set status from fetched data
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to load lawyer data: ${message}`);
        console.error('Fetch lawyer error:', message);
      } finally {
        setLoadingInitialData(false);
      }
    };
    fetchLawyerData();
  }, [lawyerId]);

  const handleOpenConfirmDialog = (event) => {
    event.preventDefault();
    setError('');
    if (!name || !initials || !email || !rank || !status) {
      setError('Name, Initials, Email, Rank, and Status are required.');
      return;
    }
    setOpenConfirmDialog(true);
    setConfirmInput('');
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirmDialog(false);
    if (confirmInput.toLowerCase() !== 'yes') {
      setError('Update cancelled.');
      return;
    }
    setLoading(true);

    try {
      await axiosInstance.put(`/lawyers/${lawyerId}`, {
        name,
        initials,
        email,
        address,
        rank,
        status, // Include status in update payload
      });
      navigate('/lawyers');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to update lawyer: ${message}`);
      console.error('Update lawyer error:', message);
      if (err.response?.status === 401) { setError('Session expired or invalid.'); }
      if (err.response?.status === 403) { setError('Not authorized to update lawyer.'); }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (loadingInitialData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Edit Lawyer
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
        )}
        <Box component="form" onSubmit={handleOpenConfirmDialog} noValidate sx={{ mt: 1 }}>
          {/* Form fields similar to AddLawyerPage, pre-populated */}
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <TextField margin="normal" required fullWidth id="initials" label="Initials (Max 5 chars)" name="initials" inputProps={{ maxLength: 5 }} value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase())} disabled={loading} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="rank-label">Rank</InputLabel>
            <Select labelId="rank-label" id="rank" value={rank} label="Rank" onChange={(e) => setRank(e.target.value)} disabled={loading}>
              {lawyerRanks.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              {lawyerStatuses.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="normal" fullWidth id="address" label="Address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} multiline rows={3} />
          <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Lawyer'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to update this lawyer's profile? Type 'yes' to confirm.
          </DialogContentText>
          <TextField autoFocus margin="dense" id="confirm" label="Type 'yes' to confirm" type="text" fullWidth variant="standard" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmSubmit} disabled={confirmInput.toLowerCase() !== 'yes'} variant="contained" color="primary">
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EditLawyerPage;
