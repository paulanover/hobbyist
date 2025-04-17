import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Menu, MenuItem, Avatar,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, CssBaseline
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

function Layout({ children }) {
  const navigate = useNavigate();
  const authState = useAuth() || {};
  const { userInfo = null, logout } = authState;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
        navigate('/login');
      } catch (err) {
        console.error('Logout failed:', err);
      }
    } else {
      console.error("Logout function not available from auth context.");
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const openUserMenu = Boolean(anchorEl);

  const handleUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const activeStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/dashboard"
            style={({ isActive }) => isActive ? activeStyle : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        {(userInfo?.role === 'admin' || userInfo?.role === 'lawyer') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/timesheet"
                style={({ isActive }) => isActive ? activeStyle : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary="Electronic Time Sheet" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/timesheet/monthly"
                style={({ isActive }) => isActive ? activeStyle : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary="Monthly Timesheet" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {(userInfo?.role === 'admin' || userInfo?.role === 'accountant' || userInfo?.role === 'lawyer') && (
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/lawyer-timesheet"
              style={({ isActive }) => isActive ? activeStyle : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>
                <AccessTimeIcon />
              </ListItemIcon>
              <ListItemText primary="Lawyer Time Sheet" />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/lawyers"
            style={({ isActive }) => isActive ? activeStyle : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>
              <GavelIcon />
            </ListItemIcon>
            <ListItemText primary="Lawyers" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/matters"
            style={({ isActive }) => isActive ? activeStyle : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Matters" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/clients"
            style={({ isActive }) => isActive ? activeStyle : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Clients" />
          </ListItemButton>
        </ListItem>
        {userInfo?.role === 'admin' && (
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/users"
              style={({ isActive }) => isActive ? activeStyle : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          '@media (max-width:600px)': {
            minHeight: 56,
          },
        }}
      >
        <Toolbar>
          {userInfo && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            AASP Law System
          </Typography>
          {userInfo ? (
            <>
              <IconButton
                onClick={handleUserMenu}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={openUserMenu ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openUserMenu ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={openUserMenu}
                onClose={handleCloseUserMenu}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled sx={{ opacity: '1 !important' }}>
                  <Typography variant="body2">Signed in as {userInfo.name}</Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleCloseUserMenu(); handleLogout(); }}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flexGrow: 1, mt: { xs: '56px', sm: '64px' } }}>
        {userInfo && (
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${userInfo ? drawerWidth : 0}px)` },
          }}
        >
          {children}
        </Box>
      </Box>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' AASP Law. All rights reserved.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
