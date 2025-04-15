import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Box, CircularProgress } from '@mui/material'; // Import MUI components for loading

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

  // Check if user is authenticated AND has the 'admin' role
  // Use userInfo here
  const isAdmin = userInfo && userInfo.role === 'admin';
  const isAuthenticated = !!userInfo; // Determine isAuthenticated based on userInfo presence

  // If user is admin, render the nested routes (Outlet)
  // If authenticated but not admin, redirect to dashboard
  // If not authenticated, redirect to login
  if (isAdmin) {
    return <Outlet />;
  } else if (isAuthenticated) {
    // Optional: Redirect non-admins to dashboard or a specific "Unauthorized" page
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
