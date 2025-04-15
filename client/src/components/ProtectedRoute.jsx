import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material'; // For loading indicator

const ProtectedRoute = () => {
  const authState = useAuth() || {};
  const { userInfo, loading } = authState; // Get loading state

  console.log('[ProtectedRoute] Rendering - Loading:', loading, 'UserInfo:', !!userInfo);

  if (loading) {
    // Show a loading spinner or return null while checking auth status
    console.log('[ProtectedRoute] Auth loading, showing spinner...');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userInfo) {
    // If loading is finished and there's no user info, redirect to login
    console.log('[ProtectedRoute] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If loading is finished and user info exists, render the child route
  console.log('[ProtectedRoute] Authenticated, rendering Outlet');
  return <Outlet />; // Outlet renders the nested child route component
};

export default ProtectedRoute;
