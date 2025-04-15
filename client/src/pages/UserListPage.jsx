import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, CircularProgress, Button, Box,
  IconButton, Tooltip, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      console.log("Fetching users...");
      try {
        const { data } = await axiosInstance.get('/users');
        setUsers(data);
        console.log("Users fetched:", data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(`Failed to fetch users: ${message}`);
        console.error('Fetch users error:', err.response || err);
        if (err.response?.status === 401) {
          setError('Session expired or invalid. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view users.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'lawyer': return 'primary';
      case 'staff': return 'info';
      default: return 'default';
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/users/${userToDelete._id}`);
      setUsers(users.filter((u) => u._id !== userToDelete._id));
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Delete user error:', err.response || err);
      setError('Failed to delete user.');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button variant="contained" component={RouterLink} to="/users/add" startIcon={<AddIcon />}>
          Add User
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 900 }} aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Linked Lawyer</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Last Updated At</TableCell>
                <TableCell>Last Updated By</TableCell>
                <TableCell>Last Change</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center">No users found.</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>{user.lawyerProfile ? `${user.lawyerProfile.name} (${user.lawyerProfile.initials})` : 'N/A'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>{user.lastUpdatedBy?.name || 'N/A'}</TableCell>
                    <TableCell>{user.lastChangeDescription || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton component={RouterLink} to={`/users/edit/${user._id}`} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton onClick={() => handleDelete(user)} size="small" color="error">
                          <DeleteIcon />
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
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default UserListPage;
