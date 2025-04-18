import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import {
  Typography, Alert, Paper, Box, CircularProgress, List, ListItem, ListItemText, Divider
} from '@mui/material';

const RecentlyDeletedMatters = () => {
  const [deletedMatters, setDeletedMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeletedMatters = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosInstance.get('/matters/deleted');
        setDeletedMatters(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load deleted matters.');
      } finally {
        setLoading(false);
      }
    };
    fetchDeletedMatters();
  }, []);

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Recently Deleted Matters (Last 5 Years)
      </Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : deletedMatters.length === 0 ? (
          <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            No recently deleted matters found.
          </Typography>
        ) : (
          <List dense>
            {deletedMatters.map((deleted) => (
              <React.Fragment key={deleted._id || deleted.originalMatterId}>
                <ListItem>
                  <ListItemText
                    primary={`${deleted.title || 'N/A'} (${deleted.docketNumber || 'N/A'})`}
                    secondary={`Deleted on: ${new Date(deleted.deletedAt).toLocaleDateString()} by ${deleted.deletedBy?.name || 'Unknown User'}`}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default RecentlyDeletedMatters;
