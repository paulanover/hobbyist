import React, { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete,
  Grid,
} from '@mui/material';

// Define possible statuses based on backend model
const statuses = ['Active', 'Inactive', 'Closed'];

function AddMatterPage() {
  const [title, setTitle] = useState('');
  const [docketSuffix, setDocketSuffix] = useState(''); // State for the 6-char part
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Active'); // Default status
  const [relevantData, setRelevantData] = useState(''); // Simple text area for now
  const [availableLawyers, setAvailableLawyers] = useState([]);
  const [selectedLawyerObjects, setSelectedLawyerObjects] = useState([]); // Store array of lawyer objects
  const [client, setClient] = useState(null); // State for selected client object
  const [availableClients, setAvailableClients] = useState([]); // State for client list
  const [loadingClients, setLoadingClients] = useState(true); // Loading state for clients
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLawyers, setLoadingLawyers] = useState(true);
  const navigate = useNavigate();

  // Fetch available lawyers for the dropdown/select
  useEffect(() => {
    const fetchLawyers = async () => {
      setLoadingLawyers(true);
      try {
        const { data } = await axiosInstance.get('/lawyers');
        setAvailableLawyers(data);
      } catch (err) {
        console.error('Failed to fetch lawyers for selection:', err);
        setError('Could not load lawyers list for assignment.');
      } finally {
        setLoadingLawyers(false);
      }
    };
    fetchLawyers();
  }, []);

  // Fetch available clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const { data } = await axiosInstance.get('/clients');
        setAvailableClients(data);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setError('Could not load clients list.');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Updated validation checks
    if (!title || !client || !category || !docketSuffix) {
      setError('Matter title, Client, Category, and Docket Suffix are required.');
      return;
    }

    // Validate category format
    if (!/^[0-9]$/.test(category)) {
      setError('Category must be a single digit (0-9).');
      return;
    }

    // Validate docket suffix format
    if (!/^[a-zA-Z0-9]{6}$/.test(docketSuffix)) {
      setError('Docket Suffix must be exactly 6 alphanumeric characters (e.g., AB12CD)');
      return;
    }

    setLoading(true);

    // Combine category and suffix into the final docketNumber string
    const finalDocketNumber = `${category}.${docketSuffix.toUpperCase()}`; // Standardize to uppercase

    // Extract only the IDs from the selected lawyer objects
    const teamAssignedIds = selectedLawyerObjects.map((lawyer) => lawyer._id);

    try {
      const { data } = await axiosInstance.post('/matters', {
        title,
        docketNumber: finalDocketNumber, // Send combined docket number
        category, // Send category separately as well
        client: client._id, // Send only the client ID
        status,
        teamAssigned: teamAssignedIds, // Send array of selected lawyer IDs
        relevantData, // Send the string directly
      });

      console.log('Matter created:', data);
      navigate('/matters'); // Redirect to matters list
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(`Failed to add matter: ${message}`);
      console.error('Add matter error:', message);
      if (err.response?.status === 401) {
        setError('Session expired or invalid. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Add New Matter
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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

          {/* Client Autocomplete */}
          <Autocomplete
            id="client-autocomplete"
            options={availableClients}
            getOptionLabel={(option) => option.name} // Display client name
            value={client}
            onChange={(event, newValue) => {
              setClient(newValue); // Update state with selected client object
            }}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            loading={loadingClients}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                required // Make client selection required
                label="Client"
                placeholder={availableClients.length > 0 ? 'Select client...' : 'Loading clients...'}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
            fullWidth
          />

          {/* Category and Docket Suffix side-by-side */}
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
                inputProps={{
                  maxLength: 1,
                  pattern: '[0-9]',
                }}
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
                onChange={(e) => setDocketSuffix(e.target.value.toUpperCase())} // Auto uppercase
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  pattern: '[a-zA-Z0-9]{6}', // HTML5 pattern hint
                  style: { textTransform: 'uppercase' }, // Visual uppercase hint
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
              SelectProps={{
                native: true,
              }}
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
            getOptionLabel={(option) => `${option.name} (${option.initials})`} // How to display options
            value={selectedLawyerObjects} // Use state holding selected objects
            onChange={(event, newValue) => {
              setSelectedLawyerObjects(newValue); // Update state with selected objects
            }}
            isOptionEqualToValue={(option, value) => option._id === value._id} // How to compare options
            loading={loadingLawyers}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                label="Assign Team"
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
                // Extract the key prop and the rest of the props
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key} // Pass the key directly
                    variant="outlined"
                    label={`${option.name} (${option.initials})`}
                    {...tagProps} // Spread the remaining props
                  />
                );
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

          {/* Wrap buttons in a Box for layout */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
            <Button
              type="button" // Important: Set type to button to prevent form submission
              fullWidth
              variant="outlined" // Use outlined style for secondary action
              onClick={() => navigate(-1)} // Go back to the previous page
              disabled={loading} // Disable if main action is loading
            >
              Back
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || loadingLawyers || loadingClients}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Matter'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default AddMatterPage;
