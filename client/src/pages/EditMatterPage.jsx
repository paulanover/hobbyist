import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container, Box, TextField, Button, Typography, Alert, CircularProgress,
  FormControl, Chip, Autocomplete,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Grid, // Import Grid
} from '@mui/material';

const statuses = ['Active', 'Inactive', 'Closed'];

function EditMatterPage() {
  const authState = useAuth() || {};
  const { userInfo } = authState;
  const [matterTeam, setMatterTeam] = useState([]); // For gating

  const { id: matterId } = useParams(); // Get matter ID from URL params
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Active');
  const [relevantData, setRelevantData] = useState('');
  const [availableLawyers, setAvailableLawyers] = useState([]);
  const [selectedLawyerObjects, setSelectedLawyerObjects] = useState([]); // Ensure default is []
  const [client, setClient] = useState(null); // Default is null
  const [availableClients, setAvailableClients] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for dialog visibility
  const [confirmInput, setConfirmInput] = useState(''); // State for confirmation input
  const [docketSuffix, setDocketSuffix] = useState(''); // State for the 6-char part

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!matterId) {
        setError('Matter ID not found.');
        setLoadingInitialData(false);
        return;
      }
      setLoadingInitialData(true);
      setError('');
      try {
        // Fetch lawyers, clients, and matter data concurrently
        const [lawyersRes, clientsRes, matterRes] = await Promise.all([
          axiosInstance.get('/lawyers?status=Active'), // Fetch active lawyers
          axiosInstance.get('/clients'),              // Fetch all clients
          axiosInstance.get(`/matters/${matterId}`),  // Fetch the specific matter
        ]);

        const fetchedLawyers = lawyersRes.data || []; // Ensure array
        const fetchedClients = clientsRes.data || []; // Ensure array
        const fetchedMatter = matterRes.data;

        setAvailableLawyers(fetchedLawyers);
        setAvailableClients(fetchedClients);
        setMatterTeam(Array.isArray(fetchedMatter.teamAssigned) ? fetchedMatter.teamAssigned : []);


        // Set matter details state
        setTitle(fetchedMatter.title);
        setStatus(fetchedMatter.status);
        setRelevantData(fetchedMatter.relevantData || '');

        // Parse fetched docketNumber (e.g., "1.AB12CD") - Improved Robustness
        const fetchedDocket = fetchedMatter.docketNumber; // Get value directly
        if (typeof fetchedDocket === 'string' && fetchedDocket.includes('.')) {
          const parts = fetchedDocket.split('.');
          // Check if parts are valid before setting state
          if (parts.length === 2 && /^[0-9]$/.test(parts[0]) && /^[a-zA-Z0-9]{6}$/.test(parts[1])) {
            setCategory(parts[0]);
            setDocketSuffix(parts[1]);
          } else {
            console.warn("Fetched docket number has unexpected format:", fetchedDocket);
            // Fallback: Use category field if available, clear suffix
            setCategory(fetchedMatter.category || '');
            setDocketSuffix('');
          }
        } else {
          // Handle cases where docketNumber is missing, null, or doesn't contain '.'
          console.warn("Fetched docket number is missing or invalid:", fetchedDocket);
          setCategory(fetchedMatter.category || ''); // Use category if available
          setDocketSuffix(''); // Ensure suffix is cleared
        }

        // Pre-select client using the fetched data
        const matterClient = fetchedMatter.client; // Can be object or just ID depending on backend populate
        if (fetchedClients.length > 0 && matterClient) {
          // Find client based on ID, whether matterClient is object or ID string
          const clientIdToFind = typeof matterClient === 'object' ? matterClient._id : matterClient;
          const preselectedClient = fetchedClients.find((c) => c?._id === clientIdToFind);
          setClient(preselectedClient || null);
        } else {
          setClient(null); // Default to null
        }

        // Pre-select assigned lawyers using the fetched data
        const matterTeam = fetchedMatter.teamAssigned || []; // Ensure array
        if (fetchedLawyers.length > 0 && matterTeam.length > 0) {
          const preselectedLawyers = fetchedLawyers.filter((lawyer) =>
            // Add checks for lawyer and assigned objects/IDs
            lawyer?._id && matterTeam.some((assigned) => assigned?._id === lawyer._id)
          );
          setSelectedLawyerObjects(preselectedLawyers);
        } else {
          setSelectedLawyerObjects([]); // Default to empty array
        }

      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load data.';
        setError(message);
        console.error('Fetch initial data error:', err);
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, [matterId]); // Only re-run if matterId changes

  // Original submit handler now just opens the dialog
  const handleOpenConfirmDialog = (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors before showing dialog

    // Perform basic validation before opening dialog
    if (!title || !client || !category || !docketSuffix) {
      setError('Matter title, Client, Category, and Docket Suffix are required.');
      return;
    }
    if (!/^[0-9]$/.test(category)) {
      setError('Category must be a single digit (0-9).');
      return;
    }
    if (!/^[a-zA-Z0-9]{6}$/.test(docketSuffix)) {
      setError('Docket Suffix must be exactly 6 alphanumeric characters.');
      return;
    }

    setOpenConfirmDialog(true); // Open the confirmation dialog
    setConfirmInput(''); // Reset confirmation input
  };

  // Function to actually perform the update after confirmation
  const handleConfirmSubmit = async () => {
    setOpenConfirmDialog(false); // Close dialog first

    if (confirmInput.toLowerCase() !== 'yes') {
      setError('Update cancelled.'); // Optional: show cancellation message
      return; // Do nothing if confirmation is incorrect
    }

    setLoading(true); // Start loading indicator

    const teamAssignedIds = selectedLawyerObjects.map((lawyer) => lawyer._id);

    // Combine category and suffix into the final docketNumber string
    const finalDocketNumber = `${category}.${docketSuffix.toUpperCase()}`;

    try {
      const { data } = await axiosInstance.put(`/matters/${matterId}`, {
        title,
        docketNumber: finalDocketNumber, // Send combined docket number
        category, // Send category separately
        client: client?._id, // Send client ID
        status,
        teamAssigned: teamAssignedIds,
        relevantData,
      });

      console.log('Matter updated:', data);
      navigate('/matters'); // Redirect back to matters list
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to update matter: ${message}`);
      console.error('Update matter error:', message);
      if (err.response?.status === 401) {
        setError('Session expired or invalid. Please log in again.');
      }
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (loadingInitialData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Access gating logic
  let isAllowed = false;
  if (userInfo) {
    if (userInfo.role === 'admin' || userInfo.role === 'accountant') {
      isAllowed = true;
    } else if (userInfo.role === 'lawyer') {
      const rank = userInfo.lawyerProfile?.rank;
      if (rank === 'Partner' || rank === 'Junior Partner') {
        isAllowed = true;
      } else if ((rank === 'Senior Associate' || rank === 'Associate') && userInfo.lawyerProfile?._id && Array.isArray(matterTeam)) {
        // Check if lawyer is part of teamAssigned
        isAllowed = matterTeam.some(member => member?._id === userInfo.lawyerProfile._id);
      }
    }
  }

  if (!isAllowed) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5">Access Denied</Typography>
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            You do not have permission to edit this matter. Only Partners, Junior Partners, Admins, Accountants, and assigned Senior Associates/Associates can access this page.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Edit Matter
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleOpenConfirmDialog} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Matter Title"
            name="title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <Autocomplete
            id="client-autocomplete"
            options={availableClients}
            getOptionLabel={(option) => option?.name || ''} // Add check for option
            value={client}
            onChange={(event, newValue) => {
              setClient(newValue); // newValue can be null
            }}
            // Safer comparison function
            isOptionEqualToValue={(option, value) => option?._id === value?._id}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                required
                label="Client"
                placeholder={availableClients.length > 0 ? 'Select client...' : 'No clients available'}
              />
            )}
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid xs={4} sm={3}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="category"
                label="Category"
                name="category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9]?$/.test(val)) {
                    setCategory(val);
                  }
                }}
                disabled={loading}
                type="text"
                inputProps={{ maxLength: 1, pattern: '[0-9]' }}
                helperText="0-9"
              />
            </Grid>
            <Grid xs={8} sm={9}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="docketSuffix"
                label="Docket Suffix"
                name="docketSuffix"
                value={docketSuffix}
                onChange={(e) => setDocketSuffix(e.target.value.toUpperCase())}
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  pattern: '[a-zA-Z0-9]{6}',
                  style: { textTransform: 'uppercase' }
                }}
                helperText='6 letters/numbers (e.g., "AB12CD")'
              />
            </Grid>
          </Grid>
          <FormControl fullWidth margin="normal" required>
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              SelectProps={{ native: true }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextField>
          </FormControl>
          <Autocomplete
            multiple
            id="team-assigned-autocomplete"
            options={availableLawyers}
            getOptionLabel={(option) => option ? `${option.name} (${option.initials})` : ''} // Add check for option
            value={selectedLawyerObjects}
            onChange={(event, newValue) => {
              setSelectedLawyerObjects(newValue || []); // Ensure newValue is array
            }}
            // Safer comparison function
            isOptionEqualToValue={(option, value) => option?._id === value?._id}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                label="Assign Team"
                placeholder={availableLawyers.length > 0 ? 'Select lawyers...' : 'No lawyers available'}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index }); // Destructure key from props
                return option ? (
                  <Chip
                    key={key} // Pass key directly
                    variant="outlined"
                    label={`${option.name} (${option.initials})`}
                    {...tagProps} // Spread the rest of the props
                  />
                ) : null;
              })
            }
            fullWidth
          />
          <TextField
            margin="normal"
            fullWidth
            id="relevantData"
            label="Relevant Data / Description"
            name="relevantData"
            value={relevantData}
            onChange={(e) => setRelevantData(e.target.value)}
            disabled={loading}
            multiline
            rows={4}
            placeholder="Enter a short description or relevant notes about the matter."
          />
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
              {loading ? <CircularProgress size={24} /> : 'Update Matter'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to update this matter? Please type 'yes' to confirm.
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

export default EditMatterPage;
