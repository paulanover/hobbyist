import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProviderWrapper } from './context/ThemeContext';
import AuthProvider from './context/AuthContext';
import App from './App.jsx';
import './index.css';
import './global.css';

// Dynamically set the base path for the router
const isProd = import.meta.env.MODE === 'production';
const routerBase = isProd ? '/hobbyist-client' : '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={routerBase}>
    <ThemeProviderWrapper>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProviderWrapper>
  </BrowserRouter>
);