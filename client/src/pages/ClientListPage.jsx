import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, CircularProgress, Button, Box,
  IconButton, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete'; // Optional: Add later

import { useAuth } from '../context/AuthContext';

function ClientListPage() {
  const authState = useAuth() || {};
  const { userInfo } = authState;
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosInstance.get('/clients');
        setClients(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to fetch clients: ${message}`);
        console.error('Fetch clients error:', err.response || err);
        if (err.response?.status === 401) {
          setError('Session expired or invalid. Please log in again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Optional: Delete handler
  // const handleDelete = async (id) => { ... };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Clients
        </Typography>
        {(userInfo && (
          (userInfo.role === 'lawyer' && (userInfo.lawyerProfile?.rank === 'Partner' || userInfo.lawyerProfile?.rank === 'Junior Partner')) ||
          userInfo.role === 'admin' ||
          userInfo.role === 'accountant'
        )) && (
          <Button variant="contained" component={RouterLink} to="/clients/add">
            Add Client
          </Button>
        )}
        {userInfo && userInfo.role === 'lawyer' && (!userInfo.lawyerProfile?.rank || (userInfo.lawyerProfile?.rank !== 'Partner' && userInfo.lawyerProfile?.rank !== 'Junior Partner')) && (
          <Typography variant="body2" color="text.secondary">
            Only Partners, Junior Partners, Admins, and Accounting can add clients.
          </Typography>
        )}
        {userInfo && userInfo.role !== 'lawyer' && userInfo.role !== 'admin' && userInfo.role !== 'accountant' && (
          <Typography variant="body2" color="text.secondary">
            You do not have permission to add clients.
          </Typography>
        )}
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 1000 }} aria-label="clients table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Owner(s)</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>VAT Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Updated By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center">No clients found.</TableCell></TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <Typography
                        component={RouterLink}
                        to={`/clients/${client._id}`}
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {client.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{client.isBusinessEntity ? 'Business' : 'Individual'}</TableCell>
                    <TableCell>
                      {client.lawyerOwners?.map(owner => owner.initials).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell>{client.email || 'N/A'}</TableCell>
                    <TableCell>{client.phone || 'N/A'}</TableCell>
                    <TableCell>{client.vatStatus || 'N/A'}</TableCell>
                    <TableCell>{new Date(client.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>{client.lastUpdatedBy?.name || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Client">
                        <IconButton component={RouterLink} to={`/clients/edit/${client._id}`} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {/* Optional Delete Button */}
                      {/* <Tooltip title="Delete Client">
                        <IconButton onClick={() => handleDelete(client._id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip> */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default ClientListPage;
