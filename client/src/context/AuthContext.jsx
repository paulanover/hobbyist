import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

const AuthContext = createContext(null);

// Change this to export default
export default function AuthProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to check initial auth status
  const [error, setError] = useState(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/users/profile');
      console.log('[AuthContext] checkAuthStatus success:', data);
      setUserInfo(data);
      setError(null);
    } catch (err) {
      console.log('[AuthContext] checkAuthStatus failed (likely not logged in):', err.message);
      setUserInfo(null);
    } finally {
      setLoading(false); // Ensure loading is set to false
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] useEffect running checkAuthStatus (should run only once on mount)...'); // Add log
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- REMOVE checkAuthStatus from dependency array

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthContext] Attempting login for:', email);
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      console.log('[AuthContext] Login API Response Data:', data);

      // --- Adjust the check here ---
      // Check for the nested user object and its _id
      if (data && data.user && data.user._id) {
        // --- Use data.user to set the state ---
        setUserInfo(data.user);
        console.log('[AuthContext] setUserInfo called with:', data.user);
        setError(null);
      } else {
        // This path is taken if data.user or data.user._id is missing
        console.error('[AuthContext] Login successful but response data invalid:', data);
        setError('Login failed: Invalid response from server.');
        setUserInfo(null);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      console.error('[AuthContext] Login API Error:', message);
      setError(message);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthContext] Attempting logout');
      await axiosInstance.post('/auth/logout');
      setUserInfo(null);
      console.log('[AuthContext] Logout successful, userInfo cleared.');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Logout failed';
      console.error('[AuthContext] Logout API Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    userInfo,
    loading,
    error,
    login,
    logout,
  }), [userInfo, loading, error, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; // Keep semicolon if preferred, or remove

// Keep useAuth as a named export
export const useAuth = () => useContext(AuthContext);
