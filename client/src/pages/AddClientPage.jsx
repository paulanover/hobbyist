import React, { useState, useEffect } from 'react'; // Add useEffect
import axiosInstance from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Divider,
  Autocomplete, Chip, // Added Autocomplete and Chip
} from '@mui/material';

// Define VAT statuses matching the backend model
const vatStatuses = ['VAT Registered', 'Non-VAT', 'VAT Exempt'];

function AddClientPage() {
  const [name, setName] = useState('');
  const [isBusinessEntity, setIsBusinessEntity] = useState(false);
  const [presidentName, setPresidentName] = useState('');
  const [authorizedRepresentative, setAuthorizedRepresentative] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vatStatus, setVatStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableLawyers, setAvailableLawyers] = useState([]); // State for lawyer list
  const [selectedLawyerOwners, setSelectedLawyerOwners] = useState([]); // State for selected owners
  const [loadingLawyers, setLoadingLawyers] = useState(true); // Loading state for lawyers
  const navigate = useNavigate();

  // Fetch available lawyers
  useEffect(() => {
    const fetchLawyers = async () => {
      setLoadingLawyers(true);
      try {
        // Fetch only active lawyers for selection
        const { data } = await axiosInstance.get('/lawyers?status=Active'); // Assuming backend supports filtering by status
        setAvailableLawyers(data);
      } catch (err) {
        console.error('Failed to fetch lawyers:', err);
        setError('Could not load lawyers list.');
      } finally {
        setLoadingLawyers(false);
      }
    };
    fetchLawyers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!name || !vatStatus) {
      setError('Full Client/Entity Name and VAT Status are required.');
      return;
    }
    if (isBusinessEntity && (!presidentName || !authorizedRepresentative)) {
      setError('President Name and Authorized Representative are required for business entities.');
      return;
    }
    setLoading(true);

    // Extract IDs from selected lawyer owner objects
    const lawyerOwnerIds = selectedLawyerOwners.map((lawyer) => lawyer._id);

    try {
      await axiosInstance.post('/clients', {
        name,
        isBusinessEntity,
        presidentName: isBusinessEntity ? presidentName : undefined,
        authorizedRepresentative: isBusinessEntity ? authorizedRepresentative : undefined,
        email,
        phone,
        address,
        vatStatus,
        lawyerOwners: lawyerOwnerIds, // Send array of selected owner IDs
      });
      navigate('/clients');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to add client: ${message}`);
      console.error('Add client error:', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Add New Client</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>

          {/* Client/Entity Details */}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Client Details</Typography>
          <TextField margin="normal" required fullWidth id="name" label="Full Client Name / Registered Entity Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={isBusinessEntity} onChange={(e) => setIsBusinessEntity(e.target.checked)} disabled={loading} />}
              label="Is Business Entity?"
            />
          </FormGroup>

          {/* Conditional Fields for Business Entity */}
          {isBusinessEntity && (
            <>
              <TextField margin="normal" required fullWidth id="presidentName" label="President Name" name="presidentName" value={presidentName} onChange={(e) => setPresidentName(e.target.value)} disabled={loading} />
              <TextField margin="normal" required fullWidth id="authorizedRepresentative" label="Duly Authorized Representative" name="authorizedRepresentative" value={authorizedRepresentative} onChange={(e) => setAuthorizedRepresentative(e.target.value)} disabled={loading} />
            </>
          )}

          {/* Lawyer Owners Autocomplete */}
          <Autocomplete
            multiple
            id="lawyer-owners-autocomplete"
            options={availableLawyers}
            getOptionLabel={(option) => `${option.name} (${option.initials})`}
            value={selectedLawyerOwners}
            onChange={(event, newValue) => {
              setSelectedLawyerOwners(newValue);
            }}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            loading={loadingLawyers}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                label="Lawyer Owner(s)"
                placeholder={availableLawyers.length > 0 ? 'Select lawyers...' : 'Loading lawyers...'}
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
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({ index });
                const { key, ...rest } = tagProps;
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={`${option.name} (${option.initials})`}
                    {...rest}
                  />
                );
              })
            }
            fullWidth
          />

          <Divider sx={{ my: 2 }} />

          {/* Contact Details */}
          <Typography variant="subtitle1">Contact Details</Typography>
          <TextField margin="normal" fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <TextField margin="normal" fullWidth id="phone" label="Phone Number" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
          <TextField margin="normal" fullWidth id="address" label="Address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} multiline rows={3} />

          <Divider sx={{ my: 2 }} />

          {/* VAT Status */}
          <Typography variant="subtitle1">Financial Details</Typography>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="vat-status-label">VAT Status</InputLabel>
            <Select
              labelId="vat-status-label"
              id="vatStatus"
              value={vatStatus}
              label="VAT Status"
              onChange={(e) => setVatStatus(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="" disabled><em>Select VAT Status</em></MenuItem>
              {vatStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading || loadingLawyers}>
            {loading ? <CircularProgress size={24} /> : 'Add Client'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default AddClientPage;
