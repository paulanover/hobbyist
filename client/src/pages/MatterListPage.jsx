import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

function MatterListPage() {
  const navigate = useNavigate();
  const location = useLocation(); // To read potential success messages from state
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || ''); // Display success message from navigation

  // State for delete confirmation
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [matterToDeleteId, setMatterToDeleteId] = useState(null);
  const [matterToDeleteTitle, setMatterToDeleteTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State for deleted matters list
  const [deletedMatters, setDeletedMatters] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(true);
  const [errorDeleted, setErrorDeleted] = useState('');

  // State for search
  const [searchTitle, setSearchTitle] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Fetch Matters
  const fetchMatters = useCallback(async () => {
    setLoading(true);
    setError('');
    setDeleteError(''); // Clear delete error on refresh
    try {
      const { data } = await axiosInstance.get('/matters'); // Assuming endpoint fetches all matters
      setMatters(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load matters.');
      console.error('Fetch matters error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Deleted Matters (Requires Backend Endpoint: GET /api/matters/deleted)
  const fetchDeletedMatters = useCallback(async () => {
    setLoadingDeleted(true);
    setErrorDeleted('');
    try {
      const { data } = await axiosInstance.get('/matters/deleted');
      setDeletedMatters(data);
    } catch (err) {
      setErrorDeleted(err.response?.data?.message || err.message || 'Failed to load deleted matters.');
      console.error('Fetch deleted matters error:', err);
    } finally {
      setLoadingDeleted(false);
    }
  }, []);

  useEffect(() => {
    fetchMatters();
    fetchDeletedMatters(); // Fetch both lists on mount
    // Clear message from location state after displaying it once
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [fetchMatters, fetchDeletedMatters, location.pathname, location.state?.message, navigate]);

  // Handle search button click
  const handleSearch = async () => {
    if (!searchTitle && !searchClient) {
      setErrorSearch('Please enter a title or client name to search.');
      setSearchResults([]);
      setSearchPerformed(true);
      return;
    }
    setLoadingSearch(true);
    setErrorSearch('');
    setSearchPerformed(true);
    try {
      const params = new URLSearchParams();
      if (searchTitle) params.append('title', searchTitle);
      if (searchClient) params.append('clientName', searchClient);

      const { data } = await axiosInstance.get(`/matters/search?${params.toString()}`);
      setSearchResults(data);
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setErrorSearch(`Search failed: ${message}`);
      console.error('Search matters error:', message);
      setSearchResults([]);
      if (err.response?.status === 401) {
        setErrorSearch('Session expired or invalid. Please log in again.');
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  // --- Delete Handlers ---
  const handleOpenConfirmDialog = (id, title) => {
    setMatterToDeleteId(id);
    setMatterToDeleteTitle(title);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setMatterToDeleteId(null);
    setMatterToDeleteTitle('');
  };

  const handleDeleteMatter = async () => {
    if (!matterToDeleteId) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      // --- ASSUMES BACKEND PERFORMS SOFT DELETE ---
      await axiosInstance.delete(`/matters/${matterToDeleteId}`);
      handleCloseConfirmDialog();
      setSuccessMessage('Matter deleted successfully.'); // Show success message
      // Refresh both lists after deletion
      fetchMatters();
      fetchDeletedMatters();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setDeleteError(`Failed to delete matter: ${message}`);
      console.error('Delete matter error:', err);
      // Keep dialog open on error? Or close? Closing for now.
      handleCloseConfirmDialog();
    } finally {
      setIsDeleting(false);
    }
  };
  // --- End Delete Handlers ---

  // --- Rendering ---

  // Handle initial loading state explicitly
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading matters...</Typography>
      </Container>
    );
  }

  // Handle error state explicitly after loading is false
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load matters: {error}
        </Alert>
        {/* Optionally add a retry button */}
        <Button onClick={fetchMatters} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  // If no error and not loading, proceed to render the page content
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:3 }}>
        <Typography variant="h4" component="h1">
          Matters
        </Typography>
        {/* SECURITY: Check permissions before showing Add button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/matters/add"
        >
          Add New Matter
        </Button>
      </Box>

      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {/* Matters Table */}
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table stickyHeader aria-label="matters table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Docket No.</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No matters found.</TableCell>
                </TableRow>
              ) : (
                matters.map((matter) => (
                  <TableRow
                    hover
                    key={matter._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography
                        component={RouterLink}
                        to={`/matters/${matter._id}`}
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {matter.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{matter.docketNumber}</TableCell>
                    <TableCell>{matter.client?.name || 'N/A'}</TableCell>
                    <TableCell>{matter.status}</TableCell>
                    <TableCell>
                      {matter.teamAssigned?.map(l => l.initials).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Matter">
                        <IconButton
                          size="small"
                          component={RouterLink}
                          to={`/matters/edit/${matter._id}`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* Add Delete Button */}
                      <Tooltip title="Delete Matter">
                        {/* SECURITY: Check permissions before enabling delete */}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenConfirmDialog(matter._id, matter.title)}
                          color="error"
                          disabled={isDeleting && matterToDeleteId === matter._id} // Disable specific button while deleting it
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recently Deleted Matters Section */}
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Recently Deleted Matters (Last 5 Years)
      </Typography>
      {errorDeleted && <Alert severity="warning" sx={{ mb: 2 }}>{errorDeleted}</Alert>}
      <Paper>
        {loadingDeleted ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : deletedMatters.length === 0 ? (
          <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            No recently deleted matters found.
          </Typography>
        ) : (
          <List dense>
            {deletedMatters.map((deleted) => (
              <React.Fragment key={deleted._id || deleted.originalMatterId}> {/* Use appropriate key */}
                <ListItem>
                  <ListItemText
                    primary={`${deleted.title || 'N/A'} (${deleted.docketNumber || 'N/A'})`}
                    secondary={`Deleted on: ${new Date(deleted.deletedAt).toLocaleDateString()} by ${deleted.deletedBy?.name || 'Unknown User'}`}
                  />
                  {/* Add Restore button here if implementing restore functionality */}
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the matter "{matterToDeleteTitle}"? This action might be reversible depending on system configuration, but the matter will be hidden.
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

      {/* --- Search Section --- */}
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Search Matters</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Search by Title"
          variant="outlined"
          size="small"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          sx={{ flexGrow: 1 }}
          disabled={loadingSearch}
        />
        <TextField
          label="Search by Client Name"
          variant="outlined"
          size="small"
          value={searchClient}
          onChange={(e) => setSearchClient(e.target.value)}
          sx={{ flexGrow: 1 }}
          disabled={loadingSearch}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loadingSearch}
          startIcon={loadingSearch ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
        >
          Search
        </Button>
      </Box>

      {/* Search Results Table */}
      {errorSearch && <Alert severity="error" sx={{ my: 2 }}>{errorSearch}</Alert>}

      {searchPerformed && !loadingSearch && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 1200 }} aria-label="search results table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Docket No.</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No matters found matching your search.</TableCell></TableRow>
              ) : (
                searchResults.map((matter) => (
                  <TableRow
                    hover
                    key={matter._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography
                        component={RouterLink}
                        to={`/matters/${matter._id}`}
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {matter.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{matter.docketNumber}</TableCell>
                    <TableCell>{matter.client?.name || 'N/A'}</TableCell>
                    <TableCell>{matter.status}</TableCell>
                    <TableCell>
                      {matter.teamAssigned?.map(l => l.initials).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Matter">
                        <IconButton
                          size="small"
                          component={RouterLink}
                          to={`/matters/edit/${matter._id}`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* Add Delete Button */}
                      <Tooltip title="Delete Matter">
                        {/* SECURITY: Check permissions before enabling delete */}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenConfirmDialog(matter._id, matter.title)}
                          color="error"
                          disabled={isDeleting && matterToDeleteId === matter._id} // Disable specific button while deleting it
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {loadingSearch && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      )}
    </Container>
  );
}

export default MatterListPage;
