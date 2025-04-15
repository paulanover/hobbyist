import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';

const userRoles = ['admin', 'lawyer', 'staff'];

function EditUserPage() {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [lawyerProfile, setLawyerProfile] = useState(null); // Selected lawyer object
  const [availableLawyers, setAvailableLawyers] = useState([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Fetch initial user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      setLoadingInitial(true);
      setError('');
      try {
        const { data } = await axiosInstance.get(`/users/${userId}`);
        setName(data.name);
        setEmail(data.email);
        setRole(data.role);
        // If lawyerProfile is populated, set it directly. Otherwise, it remains null.
        setLawyerProfile(data.lawyerProfile || null);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to load user data: ${message}`);
        console.error('Fetch user error:', err);
        if (err.response?.status === 403) { setError('Not authorized.'); }
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchUserData();
  }, [userId]);

  // Fetch available lawyers if role is 'lawyer'
  useEffect(() => {
    const fetchLawyers = async () => {
      if (role !== 'lawyer') {
        setAvailableLawyers([]);
        // Don't clear lawyerProfile here if it was pre-filled, only if role *changes* away from lawyer
        return;
      }
      setLoadingLawyers(true);
      try {
        const { data } = await axiosInstance.get('/lawyers?status=Active');
        // TODO: Filter out lawyers already linked to *other* users
        setAvailableLawyers(data);
      } catch (err) {
        console.error('Failed to fetch lawyers:', err);
        setError('Could not load lawyers list.');
      } finally {
        setLoadingLawyers(false);
      }
    };
    fetchLawyers();
  }, [role]); // Re-fetch when role changes

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setRole(newRole);
    if (newRole !== 'lawyer') {
      setLawyerProfile(null); // Clear lawyer profile if role is not lawyer
    }
  };

  const handleOpenConfirmDialog = (event) => {
    event.preventDefault();
    setError('');
    if (!name || !email || !role) {
      setError('Name, Email, and Role are required.');
      return;
    }
    // Add validation if lawyer role requires linking?
    // if (role === 'lawyer' && !lawyerProfile) { ... }

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
      await axiosInstance.put(`/users/${userId}`, {
        name,
        email,
        role,
        // Send ID if profile selected, null/undefined if not or role isn't lawyer
        lawyerProfile: role === 'lawyer' ? lawyerProfile?._id : null,
      });
      navigate('/users');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to update user: ${message}`);
      console.error('Update user error:', message);
      if (err.response?.status === 403) { setError('Not authorized.'); }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (loadingInitial) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Edit User</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleOpenConfirmDialog} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          {/* Password field is omitted for standard edit */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="role-label">Role</InputLabel>
            <Select labelId="role-label" id="role" value={role} label="Role" onChange={handleRoleChange} disabled={loading}>
              {userRoles.map((r) => (<MenuItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>))}
            </Select>
          </FormControl>

          {role === 'lawyer' && (
            <Autocomplete
              id="lawyer-profile-autocomplete"
              options={availableLawyers}
              getOptionLabel={(option) => `${option.name} (${option.initials})`}
              value={lawyerProfile}
              onChange={(event, newValue) => {
                setLawyerProfile(newValue);
              }}
              // Need careful comparison for pre-filled object vs options list
              isOptionEqualToValue={(option, value) => option?._id === value?._id}
              loading={loadingLawyers}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="normal"
                  label="Link to Lawyer Profile (Optional)"
                  placeholder={availableLawyers.length > 0 ? 'Select lawyer...' : 'Loading lawyers...'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loadingLawyers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              fullWidth
            />
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
             <Button type="button" fullWidth variant="outlined" onClick={() => navigate(-1)} disabled={loading}>Back</Button>
             <Button type="submit" fullWidth variant="contained" disabled={loading || (role === 'lawyer' && loadingLawyers)}>
               {loading ? <CircularProgress size={24} /> : 'Update User'}
             </Button>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Are you sure you want to update this user? Type 'yes' to confirm.</DialogContentText>
          <TextField autoFocus margin="dense" id="confirm" label="Type 'yes' to confirm" type="text" fullWidth variant="standard" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmSubmit} disabled={confirmInput.toLowerCase() !== 'yes'} variant="contained" color="primary">Confirm Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EditUserPage;
