import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Define ranks and statuses matching the backend model
const lawyerRanks = ['Partner', 'Junior Partner', 'Senior Associate', 'Associate'];
const lawyerStatuses = ['Active', 'Inactive'];

function AddLawyerPage() {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rank, setRank] = useState('');
  const [status, setStatus] = useState('Active'); // Add state for status, default to Active
  const [dateHired, setDateHired] = useState(''); // Add state for date hired
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    // Basic frontend validation (can be enhanced)
    if (!name || !initials || !email || !rank || !dateHired) {
        setError('Name, Initials, Email, Rank, and Date Hired are required.');
        setLoading(false);
        return;
    }

    try {
      const { data } = await axiosInstance.post('/lawyers', {
        name,
        initials,
        email,
        address,
        rank,
        status, // Include status in payload
        dateHired, // Include date hired in payload
      });

      console.log('Lawyer created:', data);
      // Redirect to the lawyer list page after successful creation
      navigate('/lawyers');

    } catch (err) {
      const message =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : err.message;
      setError(`Failed to add lawyer: ${message}`);
      console.error('Add lawyer error:', message);
       // Handle specific errors like 403 Forbidden if user is not admin
       if (err.response && err.response.status === 403) {
           setError('You are not authorized to perform this action.');
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Add New Lawyer
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="initials"
            label="Initials (Max 5 chars)"
            name="initials"
            inputProps={{ maxLength: 5 }} // Match backend validation
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())} // Auto uppercase
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="rank-label">Rank</InputLabel>
            <Select
              labelId="rank-label"
              id="rank"
              value={rank}
              label="Rank"
              onChange={(e) => setRank(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="" disabled>
                <em>Select Rank</em>
              </MenuItem>
              {lawyerRanks.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
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
          <TextField
            margin="normal"
            required
            fullWidth
            id="dateHired"
            label="Date Hired"
            name="dateHired"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateHired}
            onChange={(e) => setDateHired(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            id="address"
            label="Address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
            <Button
              type="button" // Prevent form submission
              fullWidth
              variant="outlined"
              onClick={() => navigate(-1)} // Go back
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
              {loading ? <CircularProgress size={24} /> : 'Add Lawyer'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default AddLawyerPage;
