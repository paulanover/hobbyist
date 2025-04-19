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
  const [ownedClients, setOwnedClients] = useState([]);
  const [teamClients, setTeamClients] = useState([]);
  const [otherClients, setOtherClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllClients = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch owned clients
        const ownedRes = await axiosInstance.get('/clients/for-lawyer-relevant');
        const owned = ownedRes.data || [];

        // 2. Fetch team member clients
        const teamRes = await axiosInstance.get('/clients/for-lawyer-matters');
        const team = teamRes.data || [];

        // 3. Fetch all clients
        const allRes = await axiosInstance.get('/clients');
        const allClients = allRes.data || [];

        // 4. Separate owner and team clients
        const ownerClients = owned.filter(c => c.lawyerOwners?.some(o => o._id === userInfo?.lawyerProfile?._id));
        const ownerIds = new Set(ownerClients.map(c => c._id));
        const teamOnlyClients = team.filter(c => !ownerIds.has(c._id));
        const teamIds = new Set(team.map(c => c._id));

        setOwnedClients(ownerClients);
        setTeamClients(teamOnlyClients);
        setOtherClients(allClients.filter(c => !ownerIds.has(c._id) && !teamIds.has(c._id)));
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to fetch clients: ${message}`);
        if (err.response?.status === 401) {
          setError('Session expired or invalid. Please log in again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAllClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.lawyerProfile?._id]);

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
        <>
          {/* Owned Clients Table */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Clients You Own</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table sx={{ minWidth: 1000 }} aria-label="owned clients table">
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
                {ownedClients.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center">No owned clients found.</TableCell></TableRow>
                ) : (
                  ownedClients.map((client) => (
                    <TableRow key={client._id}>
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
                        {userInfo && (
                          (userInfo.role === 'admin' || userInfo.role === 'accountant' ||
                            (userInfo.role === 'lawyer' && (userInfo.lawyerProfile?.rank === 'Partner' || userInfo.lawyerProfile?.rank === 'Junior Partner'))
                          ) && (
                            <Tooltip title="Edit Client">
                              <IconButton component={RouterLink} to={`/clients/edit/${client._id}`} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Team Member Clients Table */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Clients Where You Are a Team Member</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table sx={{ minWidth: 1000 }} aria-label="team member clients table">
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
                {teamClients.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center">No team member clients found.</TableCell></TableRow>
                ) : (
                  teamClients.map((client) => (
                    <TableRow key={client._id}>
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
                        {/* Only show Edit if also owner, admin, or accounting */}
                        {userInfo && (
                          (userInfo.role === 'admin' || userInfo.role === 'accountant' ||
                            (userInfo.role === 'lawyer' && client.lawyerOwners?.some(o => o._id === userInfo.lawyerProfile?._id) &&
                              (userInfo.lawyerProfile?.rank === 'Partner' || userInfo.lawyerProfile?.rank === 'Junior Partner'))
                          ) && (
                            <Tooltip title="Edit Client">
                              <IconButton component={RouterLink} to={`/clients/edit/${client._id}`} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* All Other Clients Table */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>All Other Firm Clients</Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 1000 }} aria-label="other clients table">
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
                {otherClients.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center">No other clients found.</TableCell></TableRow>
                ) : (
                  otherClients.map((client) => (
                    <TableRow key={client._id}>
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
                        {/* Only Admin/Accounting can edit in this table */}
                        {userInfo && (userInfo.role === 'admin' || userInfo.role === 'accountant') && (
                          <Tooltip title="Edit Client">
                            <IconButton component={RouterLink} to={`/clients/edit/${client._id}`} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
}

export default ClientListPage;
