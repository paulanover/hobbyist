import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Link,
} from '@mui/material';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Provide a default empty object to prevent destructuring error
  const authState = useAuth() || {};
  // Destructure, providing defaults if properties might be missing initially
  const { login, loading = false, error = null, userInfo = null } = authState;

  // Redirect if already logged in
  useEffect(() => {
    // Log userInfo changes
    console.log('[LoginPage] useEffect triggered. userInfo:', userInfo);
    if (userInfo) {
      // Redirect lawyers to /timesheet, everyone else to /dashboard
      if (userInfo.role === 'lawyer') {
        console.log('[LoginPage] userInfo found, role is lawyer, navigating to /timesheet');
        navigate('/timesheet', { replace: true });
      } else {
        console.log('[LoginPage] userInfo found, role is', userInfo.role, ', navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [userInfo, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (login) { // Check if login function exists
        try {
            console.log('[LoginPage] Calling context login function...'); // Log before calling login
            await login(email, password);
            console.log('[LoginPage] Context login function finished.'); // Log after calling login
            // Navigation is handled by the useEffect hook now
        } catch (err) {
            // Error is likely handled and stored in the AuthContext's error state
            console.error("[LoginPage] Login attempt failed in component:", err);
        }
    } else {
        console.error("[LoginPage] Login function not available from auth context.");
        // Optionally set a local error state here if context doesn't handle it
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        {/* Display error from AuthContext */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {/* Optional: Add Remember Me checkbox */}
          {/* <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          /> */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          {/* Optional: Links for password reset or registration */}
          {/* <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid> */}
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;