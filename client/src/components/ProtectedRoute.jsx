import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material'; // For loading indicator

const ProtectedRoute = () => {
  const authState = useAuth() || {};
  const { userInfo, loading } = authState; // Get loading state
  const location = window.location.pathname;

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

  // Lawyer role: only allow access to /timesheet
  if (userInfo.role === 'lawyer' && location !== '/timesheet') {
    console.log('[ProtectedRoute] Lawyer tried to access', location, 'redirecting to /timesheet');
    return <Navigate to="/timesheet" replace />;
  }

  // Non-lawyer: allow access to all protected routes
  console.log('[ProtectedRoute] Authenticated, rendering Outlet');
  return <Outlet />; // Outlet renders the nested child route component
};

export default ProtectedRoute;
