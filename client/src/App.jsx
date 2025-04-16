// filepath: /Users/pwa/PERSONAL PROJECT/law-office-system/client/src/App.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material'; // Keep CssBaseline here
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LawyerListPage from './pages/LawyerListPage';
import AddLawyerPage from './pages/AddLawyerPage';
import EditLawyerPage from './pages/EditLawyerPage';
import LawyerDetailPage from './pages/LawyerDetailPage';
import MatterListPage from './pages/MatterListPage';
import AddMatterPage from './pages/AddMatterPage';
import EditMatterPage from './pages/EditMatterPage';
import MatterDetailsPage from './pages/MatterDetailsPage';
import ClientListPage from './pages/ClientListPage';
import AddClientPage from './pages/AddClientPage';
import EditClientPage from './pages/EditClientPage';
import ClientDetailPage from './pages/ClientDetailPage';
import UserListPage from './pages/UserListPage';
import AddUserPage from './pages/AddUserPage';
import EditUserPage from './pages/EditUserPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AdminRoute from './components/AdminRoute';
import LawyerTimesheet from './pages/LawyerTimesheet';

function App() {
  return (
    <>
      <CssBaseline /> {/* Apply baseline styles */}
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate replace to="/login" />} />

          {/* Protected Routes (Logged In Users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/timesheet" element={<LawyerTimesheet />} />
            <Route path="/lawyers" element={<LawyerListPage />} />
            <Route path="/lawyers/:id" element={<LawyerDetailPage />} />
            <Route path="/matters" element={<MatterListPage />} />
            <Route path="/matters/add" element={<AddMatterPage />} />
            <Route path="/matters/edit/:id" element={<EditMatterPage />} />
            <Route path="/matters/:id" element={<MatterDetailsPage />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/add" element={<AddClientPage />} />
            <Route path="/clients/edit/:id" element={<EditClientPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/lawyers/add" element={<AddLawyerPage />} />
            <Route path="/lawyers/edit/:id" element={<EditLawyerPage />} />
            <Route path="/users" element={<UserListPage />} />
            <Route path="/users/add" element={<AddUserPage />} />
            <Route path="/users/edit/:id" element={<EditUserPage />} />
          </Route>
        </Routes>
      </Layout>
    </>
  );
}

export default App;