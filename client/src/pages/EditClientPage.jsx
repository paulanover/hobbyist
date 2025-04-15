import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Divider,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Autocomplete, Chip,
} from '@mui/material';

// Define VAT statuses matching the backend model
const vatStatuses = ['VAT Registered', 'Non-VAT', 'VAT Exempt'];

function EditClientPage() {
  const { id: clientId } = useParams();
  const navigate = useNavigate();

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
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [availableLawyers, setAvailableLawyers] = useState([]);
  const [selectedLawyerOwners, setSelectedLawyerOwners] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!clientId) {
        setError('Client ID not found.');
        setLoadingInitial(false);
        return;
      }
      setLoadingInitial(true);
      setError('');
      try {
        const [lawyersRes, clientRes] = await Promise.all([
          axiosInstance.get('/lawyers?status=Active'),
          axiosInstance.get(`/clients/${clientId}`),
        ]);

        const fetchedLawyers = lawyersRes.data || [];
        const fetchedClient = clientRes.data;

        setAvailableLawyers(fetchedLawyers);

        setName(fetchedClient.name);
        setIsBusinessEntity(fetchedClient.isBusinessEntity || false);
        setPresidentName(fetchedClient.presidentName || '');
        setAuthorizedRepresentative(fetchedClient.authorizedRepresentative || '');
        setEmail(fetchedClient.email || '');
        setPhone(fetchedClient.phone || '');
        setAddress(fetchedClient.address || '');
        setVatStatus(fetchedClient.vatStatus || '');

        const clientOwners = fetchedClient.lawyerOwners || [];
        if (fetchedLawyers.length > 0 && clientOwners.length > 0) {
          const preselected = fetchedLawyers.filter((lawyer) =>
            lawyer?._id && clientOwners.some((owner) => owner?._id === lawyer._id)
          );
          setSelectedLawyerOwners(preselected);
        } else {
          setSelectedLawyerOwners([]);
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load data.';
        setError(message);
        console.error('Fetch initial data error:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, [clientId]);

  const handleOpenConfirmDialog = (event) => {
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

    const lawyerOwnerIds = selectedLawyerOwners.map((lawyer) => lawyer._id);

    try {
      await axiosInstance.put(`/clients/${clientId}`, {
        name,
        isBusinessEntity,
        presidentName: isBusinessEntity ? presidentName : undefined,
        authorizedRepresentative: isBusinessEntity ? authorizedRepresentative : undefined,
        email,
        phone,
        address,
        vatStatus,
        lawyerOwners: lawyerOwnerIds,
      });
      navigate('/clients');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to update client: ${message}`);
      console.error('Update client error:', message);
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
        <Typography component="h1" variant="h5">Edit Client</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleOpenConfirmDialog} noValidate sx={{ mt: 1, width: '100%' }}>

          <Typography variant="subtitle1" sx={{ mt: 2 }}>Client Details</Typography>
          <TextField margin="normal" required fullWidth id="name" label="Full Client Name / Registered Entity Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={isBusinessEntity} onChange={(e) => setIsBusinessEntity(e.target.checked)} disabled={loading} />}
              label="Is Business Entity?"
            />
          </FormGroup>

          {isBusinessEntity && (
            <>
              <TextField margin="normal" required fullWidth id="presidentName" label="President Name" name="presidentName" value={presidentName} onChange={(e) => setPresidentName(e.target.value)} disabled={loading} />
              <TextField margin="normal" required fullWidth id="authorizedRepresentative" label="Duly Authorized Representative" name="authorizedRepresentative" value={authorizedRepresentative} onChange={(e) => setAuthorizedRepresentative(e.target.value)} disabled={loading} />
            </>
          )}

          <Autocomplete
            multiple
            id="lawyer-owners-autocomplete"
            options={availableLawyers}
            getOptionLabel={(option) => option ? `${option.name} (${option.initials})` : ''}
            value={selectedLawyerOwners}
            onChange={(event, newValue) => {
              setSelectedLawyerOwners(newValue || []);
            }}
            isOptionEqualToValue={(option, value) => option?._id === value?._id}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                label="Lawyer Owner(s)"
                placeholder={availableLawyers.length > 0 ? 'Select lawyers...' : 'No lawyers available'}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return option ? (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={`${option.name} (${option.initials})`}
                    {...tagProps}
                  />
                ) : null;
              })
            }
            fullWidth
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">Contact Details</Typography>
          <TextField margin="normal" fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <TextField margin="normal" fullWidth id="phone" label="Phone Number" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
          <TextField margin="normal" fullWidth id="address" label="Address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} multiline rows={3} />

          <Divider sx={{ my: 2 }} />

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
              {loading ? <CircularProgress size={24} /> : 'Update Client'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to update this client's profile? Type 'yes' to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="confirm"
            label="Type 'yes' to confirm"
            type="text"
            fullWidth
            variant="standard"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmSubmit}
            disabled={confirmInput.toLowerCase() !== 'yes'}
            variant="contained"
            color="primary"
          >
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EditClientPage;
