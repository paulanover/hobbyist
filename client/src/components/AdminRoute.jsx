import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Box, CircularProgress, Alert } from '@mui/material'; // Import MUI components for loading

const AdminRoute = () => {
  // Use AuthContext to get user info and loading state
  // Correctly destructure userInfo, not user
  const { userInfo, loading } = useAuth();

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Allow Admins and Lawyer Partners/Junior Partners to access
  const isAllowed = userInfo && (
    userInfo.role === 'admin' ||
    (userInfo.role === 'lawyer' && ['Partner', 'Junior Partner'].includes(userInfo.lawyerProfile?.rank))
  );
  const isAuthenticated = !!userInfo; // Determine isAuthenticated based on userInfo presence

  // If user is allowed, render the nested routes (Outlet)
  // If authenticated but not allowed, redirect to dashboard
  // If not authenticated, redirect to login
  if (isAllowed) {
    return <Outlet />;
  } else if (isAuthenticated) {
    // Show unauthorized error on the same page
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </Box>
    );
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
