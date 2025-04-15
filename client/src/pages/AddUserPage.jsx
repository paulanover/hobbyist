import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
} from '@mui/material';

const userRoles = ['admin', 'lawyer', 'staff'];

function AddUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff'); // Default role
  const [lawyerProfile, setLawyerProfile] = useState(null); // Selected lawyer object
  const [availableLawyers, setAvailableLawyers] = useState([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch available lawyers if role is 'lawyer'
  useEffect(() => {
    const fetchLawyers = async () => {
      if (role !== 'lawyer') {
        setAvailableLawyers([]);
        setLawyerProfile(null); // Clear selection if role changes
        return;
      }
      setLoadingLawyers(true);
      try {
        // Fetch active lawyers that might not be linked yet? Or all active?
        const { data } = await axiosInstance.get('/lawyers?status=Active');
        // TODO: Ideally, filter out lawyers already linked to users on the backend or frontend
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!name || !email || !password || !role) {
      setError('Name, Email, Password, and Role are required.');
      return;
    }
    if (role === 'lawyer' && !lawyerProfile) {
        // Make linking optional or mandatory based on requirements
        // setError('A Lawyer Profile must be selected for the lawyer role.');
        // return;
        console.warn("Creating lawyer user without linking profile immediately.");
    }

    setLoading(true);

    try {
      await axiosInstance.post('/users', {
        name,
        email,
        password,
        role,
        lawyerProfile: role === 'lawyer' ? lawyerProfile?._id : undefined, // Send ID or undefined
      });
      navigate('/users');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to add user: ${message}`);
      console.error('Add user error:', message);
      if (err.response?.status === 403) { setError('Not authorized.'); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Add New User</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="role-label">Role</InputLabel>
            <Select labelId="role-label" id="role" value={role} label="Role" onChange={(e) => setRole(e.target.value)} disabled={loading}>
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
              isOptionEqualToValue={(option, value) => option._id === value._id}
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
               {loading ? <CircularProgress size={24} /> : 'Add User'}
             </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default AddUserPage;
